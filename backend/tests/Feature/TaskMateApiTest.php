<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskMateApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receives_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Alice Dev',
            'email' => 'alice@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
                'token',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'alice@example.com',
        ]);
    }

    public function test_registration_validates_required_fields_and_unique_email(): void
    {
        User::factory()->create(['email' => 'duplicate@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Dup User',
            'email' => 'duplicate@example.com',
            'password' => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
                'token',
            ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'valid@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'valid@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_view_profile_and_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $meResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me');

        $meResponse->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
            ]);

        $logoutResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);
    }

    public function test_user_can_create_task(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/tasks', [
                'title' => 'Complete documentation',
                'description' => 'Write comprehensive README and API docs',
                'status' => 'Pending',
                'due_date' => '2026-12-01',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'task' => [
                    'title' => 'Complete documentation',
                    'status' => 'Pending',
                    'user_id' => $user->id,
                ],
            ]);

        $this->assertDatabaseHas('tasks', [
            'title' => 'Complete documentation',
            'user_id' => $user->id,
        ]);
    }

    public function test_user_can_read_and_filter_tasks(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        Task::create([
            'user_id' => $user->id,
            'title' => 'Buy groceries',
            'description' => 'Milk, bread, eggs',
            'status' => 'Pending',
            'due_date' => '2026-11-20',
        ]);

        Task::create([
            'user_id' => $user->id,
            'title' => 'Write backend unit tests',
            'description' => 'Ensure 100% route coverage',
            'status' => 'Completed',
            'due_date' => '2026-11-25',
        ]);

        // Test status filtering
        $filterResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/tasks?status=Pending');

        $filterResponse->assertStatus(200);
        $this->assertCount(1, $filterResponse->json('tasks'));
        $this->assertEquals('Buy groceries', $filterResponse->json('tasks.0.title'));

        // Test search filtering
        $searchResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/tasks?search=unit');

        $searchResponse->assertStatus(200);
        $this->assertCount(1, $searchResponse->json('tasks'));
        $this->assertEquals('Write backend unit tests', $searchResponse->json('tasks.0.title'));
    }

    public function test_user_cannot_access_or_modify_other_users_tasks(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $task1 = Task::create([
            'user_id' => $user1->id,
            'title' => 'Private Task for User 1',
            'status' => 'Pending',
        ]);

        $token2 = $user2->createToken('user2_token')->plainTextToken;

        // User 2 tries to view User 1's task
        $showResponse = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson("/api/tasks/{$task1->id}");
        $showResponse->assertStatus(403);

        // User 2 tries to update User 1's task
        $updateResponse = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->putJson("/api/tasks/{$task1->id}", ['title' => 'Hacked Task']);
        $updateResponse->assertStatus(403);

        // User 2 tries to delete User 1's task
        $deleteResponse = $this->withHeader('Authorization', 'Bearer '.$token2)
            ->deleteJson("/api/tasks/{$task1->id}");
        $deleteResponse->assertStatus(403);

        // User 1's task in database remains untouched
        $this->assertDatabaseHas('tasks', [
            'id' => $task1->id,
            'title' => 'Private Task for User 1',
        ]);
    }

    public function test_user_can_update_and_delete_own_task(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Initial Title',
            'status' => 'Pending',
        ]);

        // Update
        $updateResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/tasks/{$task->id}", [
                'title' => 'Updated Title',
                'status' => 'In Progress',
            ]);

        $updateResponse->assertStatus(200)
            ->assertJson([
                'task' => [
                    'title' => 'Updated Title',
                    'status' => 'In Progress',
                ],
            ]);

        // Delete
        $deleteResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson("/api/tasks/{$task->id}");

        $deleteResponse->assertStatus(200);

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_dashboard_stats_endpoint(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        Task::create(['user_id' => $user->id, 'title' => 'T1', 'status' => 'Pending']);
        Task::create(['user_id' => $user->id, 'title' => 'T2', 'status' => 'Pending']);
        Task::create(['user_id' => $user->id, 'title' => 'T3', 'status' => 'In Progress']);
        Task::create(['user_id' => $user->id, 'title' => 'T4', 'status' => 'Completed']);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJson([
                'stats' => [
                    'total' => 4,
                    'pending' => 2,
                    'in_progress' => 1,
                    'completed' => 1,
                ],
            ]);
    }

    public function test_ai_assistant_endpoint_provides_configuration_guidance_when_key_absent(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/ai/chat', [
                'message' => 'What tasks should I do first today?',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'reply',
            ]);
    }
}
