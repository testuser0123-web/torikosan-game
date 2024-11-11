import React, { forwardRef } from "react";
import { Post } from "../app/page";
import Image from "next/image";
// eslint-disable-next-line react/display-name
const PostItem = forwardRef<HTMLDivElement, { post: Post; userId: string }>(
  ({ post, userId }, ref) => {
    return (
      <div key={post.id} ref={ref} style={{ marginBottom: "15px" }}>
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

          <p
            style={{
              color:
                post.content.indexOf("勝ち") !== -1
                  ? "red"
                  : userId === post.user_id
                  ? "limegreen"
                  : "",
            }}
          >
            {post.content}
          </p>
        </div>
        <small>
          {post.id}. {new Date(post.created_at).toLocaleString()}
        </small>
        <hr />
      </div>
    );
  }
);

export default PostItem;
