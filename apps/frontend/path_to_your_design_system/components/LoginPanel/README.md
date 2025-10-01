# LoginPanel

`LoginPanel` は Stamper の認証体験を構成する UI コンポーネントです。ブランドロゴ、ログインフォーム、補助リンクを一つのカードにまとめ、WCAG 2.1 AA を満たすよう配慮しています。

## Props

| Prop | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `onSubmit` | `(values: { email: string; password: string; rememberMe: boolean }) => void` | `undefined` | フォーム送信時にコールバックされるハンドラ。未指定の場合は UI としてのみ表示されます。 |

## 依存コンポーネント

- [`Card`](../Card/Card.tsx)
- [`Button`](../Button/Button.tsx)
- [`TextField`](../TextField/TextField.tsx)
- [`TextLink`](../TextLink/TextLink.tsx)

## デザイントークン

- `--color-brand-primary`, `--color-brand-primary-dark`：プライマリアクションのグラデーション
- `--space-*`：フォーム内の余白スケール
- `--radius-lg`：カードの角丸
- `--font-size-xl`, `--font-size-md`：見出しと本文のタイポグラフィ

## アクセシビリティ

- `form` 要素と `button type="submit"` によるキーボード操作対応
- `label` と `input` を `id` / `htmlFor` で関連付け
- エラー文章を `role="alert"` で出力
- フォーカス時のアウトラインはデザイントークン `--outline-focus` を使用

## 利用例

```tsx
import { LoginPanel } from "@stamper/design-system/LoginPanel";

export function LoginScreen() {
  return <LoginPanel onSubmit={(values) => console.log(values)} />;
}
```

## 関連ドキュメント

- Figma: `LoginPage` フレーム (docs/design/LoginPage.png)
- 仕様書: `docs/specification/2_Screen.md` の「6.1 ログイン画面」