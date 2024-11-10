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
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observer = useRef<IntersectionObserver | null>(null);

  // 投稿を取得する関数
  const fetchPosts = async (page: number) => {
    try {
      const response = await fetch(`/api/getPosts?page=${page}&limit=5`);
      const data: Post[] = await response.json();

      console.log(page);
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
    fetchPosts(page);
  }, [page]);

  // インフィニティスクロール用のIntersection Observer
  const lastPostRef = (node: HTMLDivElement) => {
    // 重複監視を防ぐ
    if (observer.current) observer.current.disconnect();
    // 新しいIntersectionObserverを作成
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        // 交差したら新しいポストを取得
        setPage((prev) => ++prev);
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
      setPage(1);
      setHasMore(true);
      setPosts([]);
      // fetchPosts(1);
    } catch (error) {
      console.error("Failed to post message:", error);
    }
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
        {posts.map((post, index) => (
          <div
            key={post.id}
            ref={posts.length === index + 1 ? lastPostRef : null}
            style={{ marginBottom: "15px" }}
          >
            <p>{post.content}</p>
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
