<?php

test('automated tests use an isolated SQLite database', function () {
    expect(app()->environment())->toBe('testing');

    expect(config('database.default'))
        ->toBe('sqlite');

    expect(config('database.connections.sqlite.database'))
        ->toBe(':memory:');
});
