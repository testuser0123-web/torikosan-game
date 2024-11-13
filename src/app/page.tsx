// app/page.tsx
"use client";

import PostItem from "@/components/PostItem";
import { useState, useEffect, useRef, useCallback } from "react";
import crypto from "crypto";
import Image from "next/image";
import Link from "next/link";
import classes from "./style.module.css";
import AudioPlayer from "@/components/AudioPlayer";

export interface Post {
  id: string;
  content: string;
  created_at: string;
  img: string | null;
  user_id: string | null;
}

export interface Winner {
  id: string;
  content: string;
  created_at: string;
  img: string | null;
}

const call = ["トリコさん！", "小松ゥ！", "マツ！", "小松くん！", "小僧ォ！"];

const MAX_POST = 500;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCall, setSelectedCall] = useState(call[1]);
  const [offset, setOffset] = useState<number>(-1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [userId, setUserID] = useState("");
  const [autoReload, setAutoReload] = useState(true);
  const [serverError, setServerError] = useState(false);
  const [lastWinner, setLastWinner] = useState<Winner | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [callQueue, setCallQueue] = useState<string[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  // 投稿を取得する関数
  const fetchPosts = async (offset: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/getPosts?offset=${offset}&limit=10`);
      if (!response.ok) {
        setServerError(true);
        return;
      } else {
        setServerError(false);
      }
      const data: Post[] = await response.json();

      if (data.length > 0) {
        const newPosts = [...posts];
        data.forEach((post) => {
          if (post.id < (posts[posts.length - 1]?.id || 1e6)) {
            newPosts.push(post);
          }
        });
        setPosts(newPosts);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // offsetが更新されたら投稿を取得する
  useEffect(() => {
    observer.current?.disconnect();
    fetchPosts(offset);
  }, [offset]);

  // 拡大禁止
  const touchHandler = (event: TouchEvent) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  };

  // user idを設定する
  useEffect(() => {
    const setID = async () => {
      const res = await fetch("/api/getUserInfo");
      const data = await res.json();
      const rawData = `${data.ip}-${data.ua}`;
      const hash = crypto.createHash("sha256").update(rawData).digest("hex");
      setUserID(hash.substring(0, 16));
    };

    setID();
    // 拡大禁止
    document.addEventListener("touchstart", touchHandler, {
      passive: false,
    });
  }, []);

  // 最新の勝者を読み込む関数
  const getLastWinner = async () => {
    const res = await fetch("/api/getLastWinner");
    const data = await res.json();
    if (data.length === 1) {
      setLastWinner(data[0]);
    }
  };

  // ページ取得時に最新の勝者を取得
  useEffect(() => {
    getLastWinner();
  }, []);

  const loadNewPosts = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      try {
        const id = posts[0]?.id || 0;
        const response = await fetch(`/api/getNewPosts?id=${id}`);
        if (!response.ok) {
          setServerError(true);
        } else {
          setServerError(false);
        }
        const data: Post[] = await response.json();

        // Audio用
        if (Array.isArray(data)) {
          const calls = data.map((post) => post.content);
          if (reset) {
            setCallQueue(calls);
          } else {
            setCallQueue((prev) => [...calls, ...prev]);
          }
        }

        if (data.length > 0) {
          const newPosts = [...posts];
          data.reverse().forEach((post) => {
            if (post.id > (posts[0]?.id || 0)) {
              newPosts.unshift(post);
            }
          });
          // 最新のMAX_POST件だけ表示
          setPosts(newPosts.slice(0, MAX_POST));
        }
      } catch (error) {
        console.error("Failed to load posts:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [posts]
  );

  // 自動更新
  useEffect(() => {
    if (autoReload) {
      const interval = setInterval(() => {
        loadNewPosts();
        getLastWinner();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoReload, loadNewPosts]);

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
    setIsPosting(true);
    e.preventDefault();
    if (!selectedCall) return;

    try {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: selectedCall, userId }),
      });
      if (response.status === 429) {
        alert("連投規制中");
      } else if (response.status === 500) {
        setServerError(true);
      } else if (response.status === 200) {
        setServerError(false);
        loadNewPosts();
        getLastWinner();
      }
    } catch (error) {
      console.error("Failed to post message:", error);
    } finally {
      setIsLoading(false);
      setIsPosting(false);
    }
  };

  // 更新ボタンを押したときの処理
  const handleClick = () => {
    loadNewPosts(true);
    getLastWinner();
  };

  const onScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const changeAutoReload = () => {
    setAutoReload((prev) => !prev);
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      {serverError && <div className="toast">Server Error</div>}
      <button className="fixed-btn" onClick={onScrollToTop}>
        🔝トップに戻る🔝
      </button>
      {lastWinner && (
        <div
          style={{
            background: "red",
            padding: "10px",
            borderRadius: "10px",
            marginBottom: "15px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {lastWinner.img && (
              <div style={{ position: "relative", marginRight: "1rem" }}>
                <Image
                  src={`/${lastWinner.img}`} // 画像のパス
                  alt={lastWinner.img} // 画像の代替テキスト
                  width={50} // 幅（ピクセル指定）
                  height={50} // 高さ（ピクセル指定）
                  style={{ borderRadius: "50%" }}
                />
              </div>
            )}

            <p
              style={{
                color: "white",
                fontWeight: "bold",
                marginRight: "2rem",
              }}
            >
              最新の勝者: {lastWinner.content}👑
            </p>
            <Link href="/winner-log" className={classes.anchor}>
              統計を見る
            </Link>
          </div>
          <small style={{ color: "white" }}>
            {new Date(lastWinner.created_at).toLocaleString()}
          </small>
        </div>
      )}
      <h1 style={{ marginBottom: "20px" }}>トリコさん・小松ゲーム</h1>

      <div>
        <div className="accordion" onClick={toggleAccordion}>
          {isOpen ? "▼" : "►"} ルール
        </div>

        {isOpen && (
          <div className="accordion-content">
            <p>
              まず、誰かが『トリコさん！』ってレスをする <br />{" "}
              こいつはつまり小松役や <br /> <br />{" "}
              そのレスの後に『小松ゥ！』『マツ！』『小松くん！』『小僧ォ！』のいずれかのレスをする{" "}
              <br /> これはつまり、トリコ、サニー、ココ、ゼブラの役ってわけや{" "}
              <br /> <br />{" "}
              『トリコさん！』の後に特定の四天王の小松呼びレスが3レス連続で続いたら、その四天王の勝ち{" "}
              <br /> <br /> 例 <br /> &gt;&gt; 3トリコさん！　&gt;&gt; 4マツ！
              &gt;&gt; 5マツ！ &gt;&gt; 6マツ！ <br /> ↑これならサニーの勝ち{" "}
              <br /> <br /> &gt;&gt; 3トリコさん！　&gt;&gt; 4マツ！ &gt;&gt;
              5小松ゥ！ &gt;&gt; 6マツ！ &gt;&gt; 7マツ！ <br /> ↑この場合は無効{" "}
              <br /> <br /> <br /> ただし、四天王の中でトリコだけは例外 <br />{" "}
              トリコは元々有利やから、勝利条件を3レスではなく5レスにする、元々小松はトリコを呼んでいるわけやしな{" "}
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
          <h4>
            何と呼ぶか選べ！
            <br />
          </h4>
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
        <button type="submit" disabled={isPosting}>
          🍖投稿🍖
        </button>
      </form>

      <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
        <button onClick={changeAutoReload} style={{ flex: "5" }}>
          🔀自動更新を{autoReload ? "オフ" : "オン"}🔀
        </button>
        <button
          onClick={handleClick}
          disabled={isLoading}
          style={{ flex: "4" }}
        >
          🔄更新🔄
        </button>
        <AudioPlayer queue={callQueue} setQueue={setCallQueue} />
      </div>
      {posts.map((post, index) => (
        <PostItem
          userId={userId}
          key={post.id}
          post={post}
          ref={
            posts.length <= MAX_POST && posts.length === index + 1
              ? lastPostRef
              : null
          }
        />
      ))}

      {!hasMore && (
        <p style={{ textAlign: "center" }}>すべての投稿が読み込まれました。</p>
      )}
    </div>
  );
}
