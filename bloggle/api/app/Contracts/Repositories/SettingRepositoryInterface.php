<?php

namespace App\Contracts\Repositories;

use App\Models\Setting;

interface SettingRepositoryInterface
{
    public function get(string $key, mixed $default = null): mixed;

    public function set(string $key, mixed $value): Setting;
}
