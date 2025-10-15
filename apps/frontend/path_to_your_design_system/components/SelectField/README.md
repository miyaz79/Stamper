# SelectField

フォームでの単一選択を提供するドロップダウンコンポーネントです。`label` と `options` を渡すことで、アクセシブルな `<select>` を簡潔に利用できます。

## 使い方

```tsx
import { SelectField } from "../path_to_your_design_system/components";

const departmentOptions = [
  { value: "", label: "部署を選択" },
  { value: "dev", label: "開発部" }
];

<SelectField
  id="department"
  label="大分類"
  options={departmentOptions}
  value={value}
  onChange={(event) => setValue(event.target.value)}
/>
```

## Props

| 名前 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `string` | ✔ | ラベルとフォーム要素を関連付けるための ID |
| `label` | `string` | ✔ | フィールドに表示するラベル |
| `options` | `{ value: string; label: string; }[]` | ✔ | 表示する選択肢 |
| `supportingText` | `string` |  | 補足説明として表示するテキスト |
| `errorText` | `string` |  | エラー時に表示するメッセージ |
| その他 | `React.SelectHTMLAttributes<HTMLSelectElement>` |  | `value`, `onChange`, `disabled` など標準属性 |

## アクセシビリティ

- ラベルとセレクトを関連付けるため、必ず `id` を指定してください。
- `supportingText` や `errorText` を設定すると、適切な `aria-describedby` が自動で付与されます。
- エラー時は境界線とメッセージを強調表示します。
