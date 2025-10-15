# CheckboxField

チェックボックス入力とラベルをまとめて提供するコンポーネントです。アクセシブルな構造で、補足テキストの表示にも対応しています。

## 使い方

```tsx
import { CheckboxField } from "../path_to_your_design_system/components";

<CheckboxField
  id="leave-toggle"
  label="休暇にする"
  checked={isLeave}
  onChange={(event) => setIsLeave(event.target.checked)}
/>
```

## Props

| 名前 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `id` | `string` | ✔ | 入力とラベルを関連付ける ID |
| `label` | `string` | ✔ | 表示するラベル |
| `supportingText` | `string` |  | ラベルの右側に表示する補足テキスト |
| その他 | `React.InputHTMLAttributes<HTMLInputElement>` |  | `checked`, `onChange`, `disabled` など標準属性 |

## アクセシビリティ

- ラベル要素で入力をラップしているため、クリック領域が広く操作しやすくなっています。
- フォーカス時にはボックスにフォーカスリングが表示されます。
- `supportingText` を利用すると、補足情報を視覚的に表示できます。
