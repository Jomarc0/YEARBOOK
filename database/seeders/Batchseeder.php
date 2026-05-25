<?php

namespace Database\Seeders;

use App\Models\Batch;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;

class BatchSeeder extends Seeder
{

    public function run(): void
    {
        $courses = [
            'Bachelor of Science in Computer Science'       => ['code' => 'BSCS', 'dept' => 'College of Computing'],
            'Bachelor of Science in Information Technology' => ['code' => 'BSIT', 'dept' => 'College of Computing'],
            'Bachelor of Science in Civil Engineering'      => ['code' => 'BSCE', 'dept' => 'College of Engineering'],
            'Bachelor of Science in Mechanical Engineering' => ['code' => 'BSME', 'dept' => 'College of Engineering'],
            'Bachelor of Science in Nursing'                => ['code' => 'BSN',  'dept' => 'College of Nursing'],
            'Bachelor of Science in Accountancy'            => ['code' => 'BSA',  'dept' => 'College of Business and Accountancy'],
            'Bachelor of Science in Psychology'             => ['code' => 'BSP',  'dept' => 'College of Liberal Arts'],
            'Bachelor of Education'                         => ['code' => 'BEd',  'dept' => 'College of Education'],
        ];

        $years = [2024, 2025, 2026];

        foreach ($courses as $courseName => $info) {
            foreach ($years as $year) {
                $batch = Batch::firstOrCreate(
                    ['course' => $courseName, 'graduation_year' => $year],
                    [
                        'name'        => "{$info['code']} Batch {$year}",
                        'course_code' => $info['code'],
                        'department'  => $info['dept'],
                    ]
                );

                // Create sections A & B for each batch by default
                foreach (['A', 'B'] as $letter) {
                    Section::firstOrCreate(
                        ['name' => $letter, 'batch_id' => $batch->id],
                        ['course' => $courseName, 'batch_year' => $year]
                    );
                }
            }
        }

        // Assign existing students to matching batches
        Batch::all()->each(function (Batch $batch) {
            User::where('course', $batch->course)
                ->where('graduation_year', $batch->graduation_year)
                ->where('role', 'student')
                ->update(['batch_id' => $batch->id]);
        });

        
        User::where('role', 'student')
            ->whereNotNull('batch_id')
            ->whereNull('section_id')
            ->get()
            ->each(function (User $user) {
                $section = Section::where('batch_id', $user->batch_id)
                    ->withCount('students')
                    ->orderBy('students_count')  
                    ->first();

                if ($section) {
                    $user->update(['section_id' => $section->id]);
                }
            });

        $this->command->info('✓ BatchSeeder complete.');
        $this->command->table(
            ['Batch', 'Department', 'Year'],
            Batch::all()->map(fn($b) => [$b->name, $b->department, $b->graduation_year])
        );
    }
}