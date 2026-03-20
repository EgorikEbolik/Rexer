import { Input } from "../ui/input"
import { Button } from "../ui/button";
import { Folder, RotateCcw, File } from "lucide-react";

interface PathInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBrowse: () => void;
  onReset: () => void;
  mode?: 'file' | 'folder';
  placeholder?: string;
}

const PathInput = ({ label, value, onChange, onBrowse, onReset, mode = "folder", placeholder }: PathInputProps) => {

  const Icon = mode === 'file' ? File : Folder;
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <Button variant="ghost" size="icon" onClick={onBrowse}>
          <Icon className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onReset}>
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
export default PathInput