<?php

namespace App\Repositories;

use App\Contracts\Repositories\SettingRepositoryInterface;
use App\Models\Setting;

class SettingRepository implements SettingRepositoryInterface
{
    public function __construct(private Setting $setting)
    {
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $setting = $this->setting->newQuery()
            ->where('key', $key)
            ->first();

        return $setting?->value ?? $default;
    }

    public function set(string $key, mixed $value): Setting
    {
        return $this->setting->newQuery()->updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
