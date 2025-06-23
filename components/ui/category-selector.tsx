"use client";

import { Category } from "@/sanity.types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";


interface CategorySelectorProps {
    categories: Category[];
}

export function CategorySelectorComponent({ categories, }: CategorySelectorProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string>("");

    return(
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full max-w-full relative flex justify-center sm:justify-start sm:flex-none items-center space-x-2 bg-blue-500 hover:bg-blue-700 hover:text-white text-white font-bold py-2 px-4 rounded"
            >
                {value
                    ? categories.find((category) => category._id === value)?.title
                    : "Filter by Category"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
            </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
            <Command>
                <CommandInput 
                    placeholder="Search category..."
                    className="h-9"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const selectedCategory = categories.find((category) =>
                                category.title?.toLowerCase().includes(e.currentTarget.value.toLocaleLowerCase())
                            );
                            if (selectedCategory?.slug?.current) {
                                router.push(`/categories/${selectedCategory.slug.current}`);
                                setValue(selectedCategory._id);
                                setOpen(false);
                            }
                        }
                    }}
                />
                <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                        {categories.map((category) => (
                            <CommandItem
                                key={category._id}
                                value={category.title}
                                onSelect={(e) => {
                                    router.push(`/categories/${category.slug?.current}`);
                                    setValue(category._id === value ? "" : category._id);
                                    setOpen(false);
                                }}
                            >
                                {category.title}
                                <Check
                                    className={cn("ml-auto h-4 w-4",
                                        value === category._id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            </CommandItem>
                        ))} 
                    </CommandGroup>
                </CommandList>
            </Command>
        </PopoverContent>
    </Popover>
    );
};
    