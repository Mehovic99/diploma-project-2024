import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { getUsername } from "../lib/userUtils";
import useFeed from "../lib/hooks/useFeed";
import Avatar from "../components/Avatar.jsx";
import Button from "../components/Button.jsx";
import FeedList from "../components/FeedList.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import ProfileEditor from "../components/ProfileEditor.jsx";
import Toast from "../components/Toast.jsx";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, bootstrapMe } = useAuth();
  const isSelf = id === "me" || (user && String(user.id) === id);
  const isOnboarding = isSelf && searchParams.get("setup") === "1";

  const [profileUser, setProfileUser] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followerUsers, setFollowerUsers] = useState([]);
  const [profileFollowerCount, setProfileFollowerCount] = useState(0);
  const [profileFollowingCount, setProfileFollowingCount] = useState(0);
  const [listsError, setListsError] = useState("");

  const [activeTab, setActiveTab] = useState("posts");

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState("");
  const [voteError, setVoteError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef(null);
  const voteQueueRef = useRef(new Map());
  const voteInFlightRef = useRef(new Set());

  const {
    items: feedPosts,
    setItems: setFeedPosts,
    reload: reloadFeed,
    loading: postsLoading,
    error: postsError,
  } = useFeed("/api/posts");
  const {
    items: followingFeed,
    setItems: setFollowingFeed,
    reload: reloadFollowing,
    loading: followingLoading,
    error: followingError,
  } = useFeed("/api/feed/following");

  useEffect(() => {
    if (isSelf) {
      setProfileUser(user ?? null);
    }
  }, [isSelf, user]);

  useEffect(() => {
    let active = true;

    const loadLists = async () => {
      if (!user) return;
      setListsError("");

      try {
        const [followingData, followersData] = await Promise.all([
          api("/api/users/me/following"),
          api("/api/users/me/followers"),
        ]);

        if (!active) return;

        const followingList = followingData?.users ?? [];
        const followerList = followersData?.users ?? [];

        setFollowingUsers(followingList);
        setFollowerUsers(followerList);

        if (isSelf) {
          setProfileFollowingCount(followingData?.following_count ?? followingList.length);
          setProfileFollowerCount(followersData?.follower_count ?? followerList.length);
        }

        if (!isSelf && id) {
          const lookupId = String(id);
          const match = [...followingList, ...followerList].find(
            (entry) => String(entry.id) === lookupId
          );
          if (match) {
            setProfileUser(match);
            setProfileFollowerCount((prev) => prev || 0);
          }
        }
      } catch (err) {
        if (!active) return;
        setListsError(err?.data?.message || err.message || "Failed to load follow data.");
      }
    };

    loadLists();

    return () => {
      active = false;
    };
  }, [id, isSelf, user]);

  useEffect(() => {
    if (isSelf || !id) return;
    if (!profileUser) {
      const fallbackId = Number(id) || id;
      setProfileUser({ id: fallbackId, name: "User" });
    }
  }, [id, isSelf, profileUser]);

  useEffect(() => {
    if (!isSelf) return;
    reloadFollowing();
  }, [id, isSelf, reloadFollowing]);

  useEffect(() => {
    if (!isSelf || activeTab !== "following") return;
    reloadFollowing();
  }, [activeTab, isSelf, reloadFollowing]);

  const userPosts = useMemo(() => {
    if (!profileUser?.id) return [];
    return feedPosts.filter((post) => post.author?.id === profileUser.id);
  }, [feedPosts, profileUser]);

  const isFollowing = profileUser
    ? followingUsers.some((entry) => entry.id === profileUser.id)
    : false;

  const displayFollowers = isSelf ? followerUsers.length : profileFollowerCount;
  const displayFollowing = isSelf ? followingUsers.length : profileFollowingCount;

  const username = getUsername(profileUser);
  const bio = profileUser?.bio || "No bio yet.";
  const location = profileUser?.location || "Location not set";
  const joined = profileUser?.joined || "Joined recently";

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(""), 2000);
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });
      await bootstrapMe();
      setUploadSuccess("Avatar updated.");
      setFile(null);
    } catch (err) {
      setUploadError(err?.data?.message || err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async ({ name, bio, avatarFile }) => {
    const updates = {};
    const trimmedName = name?.trim();

    if (trimmedName) {
      updates.name = trimmedName;
    }

    if (typeof bio === "string") {
      updates.bio = bio.trim() ? bio.trim() : null;
    }

    if (Object.keys(updates).length > 0) {
      await api("/api/users/me", {
        method: "PATCH",
        body: updates,
      });
    }

    if (avatarFile) {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      await api("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });
    }

    await bootstrapMe();
    navigate("/profile/me", { replace: true });
  };

  const handleToggleFollow = async () => {
    if (!profileUser || followBusy) return;

    setFollowBusy(true);
    setFollowError("");

    try {
      const data = await api(`/api/users/${profileUser.id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      if (data?.user) {
        setProfileUser(data.user);
      }

      if (typeof data?.follower_count === "number") {
        setProfileFollowerCount(data.follower_count);
      }

      if (isFollowing) {
        setFollowingUsers((prev) => prev.filter((entry) => entry.id !== profileUser.id));
      } else if (data?.user) {
        setFollowingUsers((prev) => [...prev, data.user]);
      }

      reloadFollowing();
    } catch (err) {
      setFollowError(err?.data?.message || err.message || "Unable to update follow.");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleUserClick = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  const handlePostClick = (post) => {
    if (!post?.slug) return;
    navigate(`/posts/${post.slug}`);
  };

  const handleDeletePost = async (post) => {
    if (!post?.slug) return;

    try {
      await api(`/api/posts/${post.slug}`, { method: "DELETE" });
      setFeedPosts((prev) => prev.filter((entry) => entry.id !== post.id));
      setFollowingFeed((prev) => prev.filter((entry) => entry.id !== post.id));
      try {
        await reloadFeed({ silent: true });
      } catch {
        // ignore refresh errors after delete
      }
      try {
        await reloadFollowing({ silent: true });
      } catch {
        // ignore refresh errors after delete
      }
      showToast("Post deleted.");
    } catch (err) {
      throw err;
    }
  };

  const processVoteQueue = useCallback(
    async function runQueue(postId) {
      const queue = voteQueueRef.current.get(postId);
      if (!queue || queue.length === 0) {
        voteInFlightRef.current.delete(postId);
        return;
      }

      voteInFlightRef.current.add(postId);

      const { slug, value } = queue.shift();
      if (queue.length === 0) {
        voteQueueRef.current.delete(postId);
      }

      try {
        const data = await api(`/api/posts/${slug}/vote`, {
          method: "POST",
          body: { value },
        });

        const nextScore = typeof data?.score === "number" ? data.score : undefined;
        const nextVoteFromServer =
          typeof data?.user_vote === "number" ? data.user_vote : 0;

        setFeedPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  score: nextScore ?? post.score,
                  user_vote: nextVoteFromServer,
                }
              : post
          )
        );
        setFollowingFeed((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  score: nextScore ?? post.score,
                  user_vote: nextVoteFromServer,
                }
              : post
          )
        );
      } catch (err) {
        setVoteError(err?.data?.message || err.message || "Unable to vote.");
        await reloadFeed();
        await reloadFollowing();
      } finally {
        runQueue(postId);
      }
    },
    [reloadFeed, reloadFollowing, setFeedPosts, setFollowingFeed]
  );

  const handleInteraction = (postId, type) => {
    const target =
      feedPosts.find((post) => post.id === postId) ??
      followingFeed.find((post) => post.id === postId);
    if (!target?.slug) return;

    setVoteError("");

    const value = type === "likes" ? 1 : -1;
    const currentScore =
      typeof target.score === "number"
        ? target.score
        : Number(target.likes ?? 0) - Number(target.dislikes ?? 0);
    const currentVote = typeof target.user_vote === "number" ? target.user_vote : 0;
    const nextVote =
      value === 1
        ? currentVote === 1
          ? 0
          : 1
        : currentVote === -1
          ? 0
          : -1;
    const optimisticScore = currentScore + (nextVote - currentVote);

    setFeedPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, score: optimisticScore, user_vote: nextVote }
          : post
      )
    );
    setFollowingFeed((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, score: optimisticScore, user_vote: nextVote }
          : post
      )
    );

    const queue = voteQueueRef.current.get(postId) ?? [];
    queue.push({ slug: target.slug, value });
    voteQueueRef.current.set(postId, queue);

    if (!voteInFlightRef.current.has(postId)) {
      processVoteQueue(postId);
    }
  };

  if (isOnboarding) {
    if (!user) {
      return <Loading message="Loading profile..." />;
    }

    return (
      <ProfileEditor user={user} isOnboarding onSave={handleProfileSave} />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-4 py-4 sm:py-8 animate-in slide-in-from-right-4 duration-300">
      <Link
        to="/"
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 px-4 sm:px-0 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to feed</span>
      </Link>

      {listsError ? <ErrorState message={listsError} /> : null}

      <div className="bg-zinc-900 sm:rounded-3xl border-y sm:border border-zinc-800 shadow-2xl overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-zinc-800 to-zinc-700"></div>
        <div className="px-6 pb-6">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="p-1 bg-zinc-900 rounded-full">
              <Avatar name={profileUser?.name ?? "User"} size="xl" src={profileUser?.avatar_url} />
            </div>
            {!isSelf ? (
              <Button
                onClick={handleToggleFollow}
                disabled={followBusy || !profileUser?.id}
                className="min-w-[120px]"
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            ) : null}
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              {profileUser?.name ?? "Profile"}
            </h1>
            <p className="text-zinc-500 text-sm mb-4">@{username}</p>
            <p className="text-zinc-200 leading-relaxed mb-4">{bio}</p>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Joined {joined}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 border-t border-zinc-800 pt-4">
            <div className="flex gap-1">
              <span className="font-bold text-white">{displayFollowing}</span>
              <span className="text-zinc-500">Following</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold text-white">{displayFollowers}</span>
              <span className="text-zinc-500">Followers</span>
            </div>
          </div>
        </div>
      </div>

      {followError ? <ErrorState message={followError} /> : null}
      {voteError ? <ErrorState message={voteError} /> : null}

      {isSelf ? (
        <form
          onSubmit={handleUpload}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-200"
            />
            <Button type="submit" disabled={!file || uploading} className="px-6">
              {uploading ? "Uploading..." : "Upload avatar"}
            </Button>
          </div>
          {uploadError ? <p className="text-sm text-red-400 mt-3">{uploadError}</p> : null}
          {uploadSuccess ? (
            <p className="text-sm text-emerald-400 mt-3">{uploadSuccess}</p>
          ) : null}
        </form>
      ) : null}

      <div className="flex border-b border-zinc-800 mb-6 sticky top-16 bg-black z-10 mx-4 sm:mx-0">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "posts"
              ? "border-white text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "following"
              ? "border-white text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Following Feed
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === "posts" ? (
          postsLoading ? (
            <Loading message="Loading posts..." />
          ) : postsError ? (
            <ErrorState message={postsError} />
          ) : (
            <FeedList
              items={userPosts}
              emptyTitle="No posts yet."
              emptySubtitle={
                isSelf
                  ? "Create your first post to see it here."
                  : "This user has not posted yet."
              }
              currentUserId={user?.id}
              onUserClick={handleUserClick}
              onPostClick={handlePostClick}
              onInteraction={handleInteraction}
              onDelete={handleDeletePost}
            />
          )
        ) : isSelf ? (
          followingLoading ? (
            <Loading message="Loading following feed..." />
          ) : followingError ? (
            <ErrorState message={followingError} />
          ) : (
            <FeedList
              items={followingFeed}
              emptyTitle="No posts here."
              emptySubtitle="When you follow someone, their posts will appear here."
              currentUserId={user?.id}
              onUserClick={handleUserClick}
              onPostClick={handlePostClick}
              onInteraction={handleInteraction}
              onDelete={handleDeletePost}
            />
          )
        ) : (
          <div className="text-center py-10 text-zinc-500">
            <p className="text-lg mb-2">Following feed is private.</p>
            <p className="text-sm">View your own profile to see your following feed.</p>
          </div>
        )}
      </div>
      <Toast message={toast} />
    </div>
  );
}
