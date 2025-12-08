<?php

namespace App\Repositories;

use App\Contracts\Repositories\VoteRepositoryInterface;
use App\Models\Post;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class VoteRepository implements VoteRepositoryInterface
{
    public function __construct(private Vote $vote)
    {
    }

    public function vote(User $user, Model $votable, int $value): Vote
    {
        if (!in_array($value, [-1, 1], true)) {
            throw new InvalidArgumentException('Vote value must be -1 or 1.');
        }

        return DB::transaction(function () use ($user, $votable, $value) {
            $existing = $this->findUserVoteFor($user, $votable);

            if ($existing !== null) {
                if ($existing->value === $value) {
                    return $existing;
                }

                $scoreDelta = $value - $existing->value;
                $existing->value = $value;
                $existing->save();

                $this->applyScoreChange($votable, $scoreDelta, false);

                return $existing;
            }

            $vote = $this->vote->newInstance(['value' => $value]);
            $vote->user()->associate($user);
            $vote->votable()->associate($votable);
            $vote->save();

            $this->applyScoreChange($votable, $value, true);

            return $vote;
        });
    }

    public function findUserVoteFor(User $user, Model $votable): ?Vote
    {
        return $this->vote->newQuery()
            ->where('user_id', $user->getKey())
            ->where('votable_type', $votable->getMorphClass())
            ->where('votable_id', $votable->getKey())
            ->first();
    }

    private function applyScoreChange(Model $votable, int $delta, bool $isNewVote): void
    {
        if ($delta !== 0) {
            $votable->increment('score', $delta);
        }

        if ($isNewVote && $votable instanceof Post) {
            $votable->increment('votes_count');
        }
    }
}
