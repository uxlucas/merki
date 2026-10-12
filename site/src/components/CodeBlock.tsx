import { CopyIcon } from 'merki-icons';
import { CopyButton } from './CopyButton';

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="code">
      <div className="code-head">
        <span>{label}</span>
        <CopyButton className="ctl" text={code} label="Copy" icon={CopyIcon} />
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
