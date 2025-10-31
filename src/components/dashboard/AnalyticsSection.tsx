"use client";

import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
} from "@hello-pangea/dnd";
import { DotsSixVertical } from "@phosphor-icons/react";
import DashboardWidget from "./widgets/DashboardWidget";
import type { DashboardWidget as WidgetType } from "./analyticsData";

interface AnalyticsSectionProps {
  widgets: WidgetType[];
}

function SortableWidget({
  widget,
  provided,
  snapshot,
}: {
  widget: WidgetType;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}) {
  return (
    <div
      className={`${snapshot.isDragging ? "opacity-50" : "relative"} h-full`}
    >
      {!snapshot.isDragging && (
        <div
          {...provided.dragHandleProps}
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
  const [isEditMode, setIsEditMode] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination || destination.index === source.index) {
      return;
    }

    const newWidgets = Array.from(widgetsState);
    const [moved] = newWidgets.splice(source.index, 1);
    newWidgets.splice(destination.index, 0, moved);
    setWidgetsState(newWidgets);
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable
            droppableId="widgets"
            direction="vertical"
            isCombineEnabled={false}
          >
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative"
              >
                {widgetsState.map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          // When dragging, remove from normal flow to prevent layout shift
                          ...(snapshot.isDragging && {
                            position: "fixed" as const,
                          }),
                        }}
                        className={snapshot.isDragging ? "z-50" : ""}
                      >
                        <SortableWidget
                          widget={widget}
                          provided={provided}
                          snapshot={snapshot}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
