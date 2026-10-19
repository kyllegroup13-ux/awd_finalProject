<?php

use Tests\TestCase;

uses(TestCase::class);

test('PHPUnit uses an isolated SQLite database', function () {
    expect(app()->environment())->toBe('testing');

    expect(config('database.default'))
        ->toBe('sqlite');

    expect(config('database.connections.sqlite.database'))
        ->toBe(':memory:');
});
