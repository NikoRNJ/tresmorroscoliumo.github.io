'use client';

import { useState, useMemo } from 'react';
import type { GaleriaCategory } from '../types';
import { FolderOpen, Image, ChevronDown, ChevronRight, Home, Camera, Layers } from 'lucide-react';

type CategoryTreeProps = {
    categories: GaleriaCategory[];
    selected: string | null;
    onSelect: (slug: string) => void;
};

type CategoryGroup = {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    categories: GaleriaCategory[];
};

export function CategoryTree({ categories, selected, onSelect }: CategoryTreeProps) {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        galeria: true,
        cabins: true,
        otros: true,
    });

    // Group categories by prefix
    const groupedCategories = useMemo(() => {
        const groups: CategoryGroup[] = [
            { name: 'Galería', icon: Camera, categories: [] },
            { name: 'Cabañas', icon: Home, categories: [] },
            { name: 'Otros', icon: Layers, categories: [] },
        ];

        for (const cat of categories) {
            const lowerName = cat.name.toLowerCase();

            // Logic: Cabins go to Cabins. System/Misc go to Others. EVERYTHING ELSE goes to Galeria.
            if (lowerName.startsWith('cabin') || lowerName.startsWith('cabaña')) {
                groups[1].categories.push(cat);
            } else if (['hero', 'proposito', 'general'].some(t => lowerName.includes(t))) {
                groups[2].categories.push(cat);
            } else {
                // Default to Galeria group (includes Exterior, Interior, Playas, etc.)
                groups[0].categories.push(cat);
            }
        }

        return groups.filter(g => g.categories.length > 0);
    }, [categories]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    };

    const getGroupKey = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');

    return (
        <aside className="border-r border-gray-200 bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-primary-50 to-white">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary-600" />
                    Categorías
                </h2>
                <p className="text-xs text-gray-500">Organización por carpetas</p>
            </div>

            <div className="p-2">
                {categories.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No hay categorías. Crea una nueva abajo.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {groupedCategories.map((group) => {
                            const groupKey = getGroupKey(group.name);
                            const isExpanded = expandedGroups[groupKey] !== false;
                            const GroupIcon = group.icon;
                            const totalImages = group.categories.reduce((sum, c) => sum + c.items.length, 0);

                            return (
                                <div key={group.name} className="rounded-lg border border-gray-100 overflow-hidden">
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleGroup(groupKey)}
                                        className="flex w-full items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            )}
                                            <GroupIcon className="h-4 w-4 text-primary-600" />
                                            <span className="font-medium text-sm text-gray-800">
                                                {group.name}
                                            </span>
                                        </div>
                                        <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                                            {totalImages} imgs
                                        </span>
                                    </button>

                                    {/* Group Items */}
                                    {isExpanded && (
                                        <div className="bg-white divide-y divide-gray-50">
                                            {group.categories.map((category) => {
                                                const isActive = category.slug === selected;
                                                // Extract short name (after " - " if present)
                                                const displayName = category.name.includes(' - ')
                                                    ? category.name.split(' - ')[1]
                                                    : category.name;

                                                return (
                                                    <button
                                                        key={category.slug}
                                                        onClick={() => onSelect(category.slug)}
                                                        className={`flex w-full items-center justify-between px-3 py-2 pl-9 text-sm transition-colors ${isActive
                                                            ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
                                                            : 'hover:bg-gray-50 text-gray-600'
                                                            }`}
                                                    >
                                                        <span className={isActive ? 'font-medium' : ''}>
                                                            {displayName}
                                                        </span>
                                                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${isActive
                                                            ? 'bg-primary-200 text-primary-800'
                                                            : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            <Image className="h-3 w-3" />
                                                            {category.items.length}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}

