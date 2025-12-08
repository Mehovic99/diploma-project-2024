<?php

namespace App\Contracts\Repositories;

use App\Models\User;
use App\Models\Vote;
use Illuminate\Database\Eloquent\Model;

interface VoteRepositoryInterface
{
    public function vote(User $user, Model $votable, int $value): Vote;

    public function findUserVoteFor(User $user, Model $votable): ?Vote;
}
