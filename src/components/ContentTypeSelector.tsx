interface ContentTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const contentTypes = [
  { id: 'article', label: '公众号文章', icon: '📝' },
  { id: 'xiaohongshu', label: '小红书', icon: '📱' },
];

export default function ContentTypeSelector({ value, onChange }: ContentTypeSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">内容类型：</span>
      <div className="flex flex-wrap gap-2">
        {contentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              value === type.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
