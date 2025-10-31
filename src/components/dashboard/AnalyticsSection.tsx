"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical } from "@phosphor-icons/react";
import DashboardWidget from "./widgets/DashboardWidget";
import type { DashboardWidget as WidgetType } from "./analyticsData";

interface AnalyticsSectionProps {
  widgets: WidgetType[];
}

function SortableWidget({
  widget,
  isDragging,
}: {
  widget: WidgetType;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: widget.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "opacity-50" : "relative"} h-full`}
    >
      {!isDragging && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing z-20 rounded p-1"
        >
          <DotsSixVertical size={18} className="text-gray-500" />
        </div>
      )}
      <DashboardWidget widget={widget} />
    </div>
  );
}

export default function AnalyticsSection({ widgets }: AnalyticsSectionProps) {
  const [widgetsState, setWidgetsState] = useState(widgets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = widgetsState.findIndex((w) => w.id === active.id);
    const newIndex = widgetsState.findIndex((w) => w.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newWidgets = Array.from(widgetsState);
      const [moved] = newWidgets.splice(oldIndex, 1);
      newWidgets.splice(newIndex, 0, moved);
      setWidgetsState(newWidgets);
    }

    setActiveId(null);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="px-4 py-1.5 text-sm font-medium text-red-primary bg-white border border-red-300 rounded-[4px] hover:bg-red-50 transition-colors"
        >
          {isEditMode ? "Done" : "Edit"}
        </button>
      </div>
      <hr className="mb-6 border-gray-200" />

      {!isEditMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {widgetsState.map((widget) => (
            <DashboardWidget key={widget.id} widget={widget} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SortableContext
              items={widgetsState.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              {widgetsState.map((widget) => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  isDragging={widget.id === activeId}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  );
}
