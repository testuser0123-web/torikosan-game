"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import style from "./log.module.css";
import { Winner } from "../page";
import Image from "next/image";

const names: string[] = ["トリコ", "サニー", "ココ", "ゼブラ"];
const img_path: { [K: string]: string } = {
  トリコ: "Toriko.png",
  サニー: "Sunny.png",
  ココ: "Coco.png",
  ゼブラ: "Zebra.png",
};

const WinnerLog = () => {
  const [count, setCount] = useState<{ [K: string]: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Winner[]>([]);

  async function getLog() {
    setIsLoading(true);
    const response = await fetch("/api/getWinnerCount");
    const data = await response.json();
    setCount(data);
    setIsLoading(false);
    const response2 = await fetch("/api/getWinners");
    const data2 = await response2.json();
    setPosts(data2);
  }
  useEffect(() => {
    getLog();
  }, []);
  const handleClick = () => {
    getLog();
  };
  return (
    <div className="container" style={{ padding: "20px" }}>
      <Link href="/" className={style.anchor}>
        &lt; ゲームに戻る
      </Link>
      <button onClick={handleClick} disabled={isLoading}>
        🔃更新🔃
      </button>
      {isLoading ? (
        "Loading…"
      ) : count ? (
        <>
          <table className="design01">
            <tbody>
              <tr>
                <th>名前</th>
                <th>勝利回数</th>
              </tr>
              {names.map((name) => {
                return (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{count[name]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <h3>最新の勝利10件を表示</h3>
        </>
      ) : (
        <p>読み込みに失敗しました。</p>
      )}
      {posts.map((post) => {
        return (
          <div key={post.id} style={{ margin: "15px 0" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {post.img && (
                <div style={{ position: "relative", marginRight: "1rem" }}>
                  <Image
                    src={`/${post.img}`} // 画像のパス
                    alt={post.img} // 画像の代替テキスト
                    width={50} // 幅（ピクセル指定）
                    height={50} // 高さ（ピクセル指定）
                    style={{ borderRadius: "50%" }}
                  />
                </div>
              )}

              <p>{post.content}</p>
            </div>
            <small>{new Date(post.created_at).toLocaleString()}</small>
            <hr />
          </div>
        );
      })}
    </div>
  );
};

export default WinnerLog;
