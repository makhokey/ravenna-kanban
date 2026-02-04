import { Button } from "@repo/ui/components/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@repo/ui/components/combobox";
import { Kbd } from "@repo/ui/components/kbd";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@repo/ui/components/tooltip";
import { TagIcon } from "lucide-react";
import { useState } from "react";
import { getSelectedTags, TAG_OPTIONS, type TagOption } from "~/lib/card-config";

type TagSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  iconOnly?: boolean;
};

export function TagSelect({ value, onChange, iconOnly }: TagSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedTags = getSelectedTags(value);

  const renderTrigger = () => {
    if (selectedTags.length === 0) {
      return (
        <>
          <TagIcon />
        </>
      );
    }
    if (selectedTags.length === 1) {
      const tag = selectedTags[0]!;
      return (
        <>
          <span className={`size-3 rounded-full ${tag.color}`} />
          <span>{tag.label}</span>
        </>
      );
    }
    return (
      <>
        <span className="flex -space-x-1">
          {selectedTags.slice(0, 2).map((tag) => (
            <span
              key={tag.value}
              className={`size-3 rounded-full ${tag.color} ring-background ring-1`}
            />
          ))}
        </span>
        <span>{selectedTags.length} tags</span>
      </>
    );
  };

  const renderIconOnlyTrigger = () => {
    if (selectedTags.length === 0) {
      return <TagIcon className="size-4" />;
    }
    return (
      <span className="flex -space-x-1">
        {selectedTags.slice(0, 3).map((tag) => (
          <span
            key={tag.value}
            className={`size-3 rounded-full ${tag.color} ring-background ring-1`}
          />
        ))}
      </span>
    );
  };

  return (
    <Combobox
      autoHighlight
      multiple
      items={TAG_OPTIONS}
      value={TAG_OPTIONS.filter((opt) => value.includes(opt.value))}
      onValueChange={(val) => onChange(val.map((v: { value: string }) => v.value))}
      open={open}
      onOpenChange={setOpen}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <ComboboxTrigger
              render={
                iconOnly ? (
                  <Button variant="ghost" size="icon-xs">
                    {renderIconOnlyTrigger()}
                  </Button>
                ) : (
                  <Button variant="outline" size="xs" className="gap-2">
                    {renderTrigger()}
                  </Button>
                )
              }
            />
          }
        />
        <TooltipPopup>
          Tags <Kbd>T</Kbd>
        </TooltipPopup>
      </Tooltip>
      <ComboboxPopup>
        <ComboboxInput
          className="border-0 p-2 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          showTrigger={false}
          placeholder="Tags..."
          endAddon={<Kbd>T</Kbd>}
          onKeyDown={(e) => {
            if (["1", "2", "3", "4", "5", "6"].includes(e.key)) {
              const option = TAG_OPTIONS[parseInt(e.key) - 1];
              if (option) {
                e.preventDefault();
                const newTags = value.includes(option.value)
                  ? value.filter((t) => t !== option.value)
                  : [...value, option.value];
                onChange(newTags);
              }
            }
          }}
        />
        <ComboboxSeparator />
        <ComboboxEmpty>No tags found.</ComboboxEmpty>
        <ComboboxList className="w-full">
          {(item: TagOption) => (
            <ComboboxItem className="w-full" key={item.value} value={item}>
              <span className={`size-2.5 rounded-full ${item.color}`} />
              <span className="flex-1">{item.label}</span>
              <ComboboxItemIndicator />
              <Kbd>{item.shortcut}</Kbd>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
