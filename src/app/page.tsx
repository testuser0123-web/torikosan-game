// app/page.tsx
"use client";

import PostItem from "@/components/PostItem";
import { useState, useEffect, useRef } from "react";

export interface Post {
  id: string;
  content: string;
  created_at: string;
  img: string | null;
}

const call = ["トリコさん！", "小松ゥ！", "マツ！", "小松くん！", "小僧ォ！"];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCall, setSelectedCall] = useState(call[0]);
  const [offset, setOffset] = useState<number>(-1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  // 投稿を取得する関数
  const fetchPosts = async (offset: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/getPosts?offset=${offset}&limit=5`);
      const data: Post[] = await response.json();

      if (data.length > 0) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    observer.current?.disconnect();
    fetchPosts(offset);
  }, [offset]);

  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    const fetchIp = async () => {
      const res = await fetch("/api/get-ip");
      const data = await res.json();
      setIpAddress(data.ip);
    };

    fetchIp();
  }, []);

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
    setIsLoading(true);
    e.preventDefault();
    if (!selectedCall) return;

    try {
      await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: selectedCall }),
      });
      loadNewPosts();
    } catch (error) {
      console.error("Failed to post message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNewPosts = async () => {
    setIsLoading(true);
    try {
      const id = posts[0]?.id || 0;
      const response = await fetch(`/api/getNewPosts?id=${id}`);
      const data: Post[] = await response.json();

      if (data.length > 0) {
        setPosts((prev) => [...data, ...prev]);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    loadNewPosts();
  };

  return (
    <div style={{ padding: "20px" }}>
      <div>
        <h3>ユーザーのIPアドレス</h3>
        <p>{ipAddress}</p>
      </div>
      <h1 style={{ marginBottom: "20px" }}>トリコさん・小松ゲーム</h1>

      <div>
        <div className="accordion" onClick={toggleAccordion}>
          {isOpen ? "▼" : "►"} ルール
        </div>

        {isOpen && (
          <div className="accordion-content">
            <p>
              まず、誰かが『トリコさん！』ってレスをする <br />{" "}
              こいつはつまり小松役 <br /> <br />{" "}
              そのレスの後に『小松ゥ！』『マツ！』『小松くん！』『小僧ォ！』のいずれかのレスをする{" "}
              <br /> これはつまり、トリコ、サニー、ココ、ゼブラの役ってわけや{" "}
              <br /> <br />{" "}
              『トリコさん！』の後に特定の四天王の小松呼びレスが3レス連続で続いたら、その四天王の勝ち{" "}
              <br /> <br /> 例 <br /> &gt;&gt; 3トリコさん！　&gt;&gt; 4マツ！
              &gt;&gt; 5マツ！ &gt;&gt; 6マツ！ <br /> ↑これならサニーの勝ち{" "}
              <br /> <br /> &gt;&gt; 3トリコさん！　&gt;&gt; 4マツ！ &gt;&gt;
              5小松ゥ！ &gt;&gt; 6マツ！ &gt;&gt; 7マツ！ <br /> ↑この場合は無効{" "}
              <br /> <br /> <br /> ただし、四天王の中でトリコだけは例外 <br />{" "}
              トリコは元々有利やから、勝利条件を3レスではなく5レスにする、元々小松はトリコを呼んでいるわけやだしな{" "}
              <br />{" "}
              これはトリコ以外の四天王に対する正当なハンディキャップというわけや{" "}
              <br /> <br /> 小松は勝った四天王のコンビになる <br />{" "}
              つまりこれは好きな四天王を勝たせる熱いゲームってわけや
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handlePost}>
        <div className="selectbox-5">
          <h3>
            何と呼ぶか選べ！
            <br />
          </h3>
          <select
            id="callSelect"
            value={selectedCall}
            onChange={(e) => {
              setSelectedCall(e.target.value);
            }}
          >
            {call.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isLoading}>
          🍖投稿🍖
        </button>
      </form>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleClick} disabled={isLoading}>
          🔃更新🔃
        </button>
        {posts.map((post, index) => (
          <PostItem
            key={post.id}
            post={post}
            ref={posts.length === index + 1 ? lastPostRef : null}
          />
        ))}
      </div>

      {!hasMore && (
        <p style={{ textAlign: "center" }}>すべての投稿が読み込まれました。</p>
      )}
    </div>
  );
}
