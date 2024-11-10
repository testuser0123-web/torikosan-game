// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";

interface Post {
  id: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState<string>("");
  const [offset, setOffset] = useState<number>(-1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observer = useRef<IntersectionObserver | null>(null);

  // 投稿を取得する関数
  const fetchPosts = async (offset: number) => {
    try {
      const response = await fetch(`/api/getPosts?offset=${offset}&limit=5`);
      const data: Post[] = await response.json();

      console.log(offset);
      console.log(data);

      if (data.length > 0) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  };

  useEffect(() => {
    observer.current?.disconnect();
    fetchPosts(offset);
  }, [offset]);

  // インフィニティスクロール用のIntersection Observer
  const lastPostRef = (node: HTMLDivElement) => {
    // 重複監視を防ぐ
    if (observer.current) observer.current.disconnect();
    // 新しいIntersectionObserverを作成
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        // 交差したら新しいポストを取得
        setOffset(parseInt(posts[posts.length - 1]?.id) || 0);
      }
    });
    // DOMの要素の監視を始める
    if (node) observer.current.observe(node);
  };

  // 投稿の追加処理
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    try {
      await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setContent("");
      setOffset(0);
      loadNewPosts();
    } catch (error) {
      console.error("Failed to post message:", error);
    }
  };

  const loadNewPosts = async () => {
    try {
      const id = posts[0]?.id || 0;
      const response = await fetch(`/api/getNewPosts?id=${id}`);
      const data: Post[] = await response.json();

      if (data.length > 0) {
        setPosts((prev) => [...data, ...prev]);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  };

  const handleClick = () => {
    loadNewPosts();
  };
  return (
    <div style={{ padding: "20px" }}>
      <h1>掲示板</h1>

      <form onSubmit={handlePost}>
        <textarea
          rows={4}
          cols={50}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="新しいポストを入力..."
        />
        <br />
        <button type="submit">投稿</button>
      </form>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleClick}
          style={{
            width: "100%",
            marginBottom: "15px",
            border: "none",
            background: "pink",
            display: "block",
            fontSize: "1em",
            padding: "5px",
            borderRadius: "0.2em",
            cursor: "pointer",
          }}
        >
          更新する
          <hr />
        </button>
        {posts.map((post, index) => (
          <div
            key={post.id}
            ref={posts.length === index + 1 ? lastPostRef : null}
            style={{ marginBottom: "15px" }}
          >
            <p>
              {post.id}: {post.content}
            </p>
            <small>{new Date(post.created_at).toLocaleString()}</small>
            <hr />
          </div>
        ))}
      </div>

      {!hasMore && (
        <p style={{ textAlign: "center" }}>すべての投稿が読み込まれました。</p>
      )}
    </div>
  );
}
