"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { api, type KanbanItem } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { GripVertical, Plus, Trash2, Loader2, Cpu, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";

type ColumnType = "todo" | "in_progress" | "done";

const COLUMNS: { id: ColumnType; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "#333" },
  { id: "in_progress", title: "In Progress", color: "#1a3a5c" },
  { id: "done", title: "Done", color: "#1a3a1a" },
];

export default function KanbanPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [addingTo, setAddingTo] = useState<ColumnType | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 1024);
      const handleResize = () => setIsMobile(window.innerWidth < 1024);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      api.kanban.list(params.id).then((data) => {
        setItems(data.sort((a, b) => a.position - b.position));
        setLoading(false);
      }).catch(console.error);
    }
  }, [params.id, user]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = source.droppableId as ColumnType;
    const destStatus = destination.droppableId as ColumnType;

    const newItems = Array.from(items);
    const draggedItem = newItems.find(i => i.id === draggableId);
    if (!draggedItem) return;

    // Remove from old
    const sourceItems = newItems.filter(i => i.status === sourceStatus).sort((a, b) => a.position - b.position);
    sourceItems.splice(source.index, 1);

    // Add to new
    const destItems = destStatus === sourceStatus ? sourceItems : newItems.filter(i => i.status === destStatus).sort((a, b) => a.position - b.position);
    destItems.splice(destination.index, 0, draggedItem);

    // Recompute positions
    const updatedState = newItems.filter(i => i.status !== sourceStatus && i.status !== destStatus)
      .concat(sourceItems.map((item, idx) => ({ ...item, position: idx, status: sourceStatus })))
      .concat(destStatus !== sourceStatus ? destItems.map((item, idx) => ({ ...item, position: idx, status: destStatus })) : []);

    setItems(updatedState);

    // API Call
    try {
      await api.kanban.update(draggableId, { status: destStatus, position: destination.index });
    } catch (e) {
      console.error(e);
      // rollback if failed could be implemented here
    }
  };

  const handleAddTask = async (e: React.FormEvent, status: ColumnType) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await api.kanban.addItem(params.id, { title: newTaskTitle });
      const newItem: KanbanItem = {
        id: res.id,
        interview_id: params.id,
        title: newTaskTitle,
        description: null,
        status,
        position: items.filter(i => i.status === status).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setItems([...items, newItem]);
      setAddingTo(null);
      setNewTaskTitle("");
      
      // Update its status correctly in backend if status is not 'todo'
      if (status !== "todo") {
         await api.kanban.update(res.id, { status, position: newItem.position });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    setItems(items.filter(i => i.id !== id));
    try {
      await api.kanban.delete(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", gap: "1.5rem", background: "#000" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Cpu size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "#fff" }}>OBX-STUDIO</h1>
          <p style={{ color: "#888", fontSize: "0.9rem", maxWidth: 280, lineHeight: 1.6 }}>
            Idea locked in! 🚀 Open this on desktop to manage your kanban board.
          </p>
        </div>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-white" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 88, paddingBottom: "2rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href={`/output/${params.id}`} className="btn btn-ghost" style={{ padding: "0.5rem" }}>
            <ArrowLeft size={16} /> Back to Output
          </Link>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Kanban Board</h1>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", alignItems: "start", height: "100%" }}>
            {COLUMNS.map(col => {
              const colItems = items.filter(i => i.status === col.id).sort((a, b) => a.position - b.position);
              return (
                <div key={col.id} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, display: "flex", flexDirection: "column", height: "100%", minHeight: 400 }}>
                  <div style={{ padding: "1rem", borderBottom: `2px solid ${col.color}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h2 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{col.title}</h2>
                      <span style={{ background: "#1a1a1a", padding: "2px 8px", borderRadius: 12, fontSize: "0.75rem", color: "#888" }}>
                        {colItems.length}
                      </span>
                    </div>
                    <button onClick={() => setAddingTo(col.id)} className="btn btn-ghost" style={{ padding: "4px" }}>
                      <Plus size={16} />
                    </button>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem", background: snapshot.isDraggingOver ? "rgba(255,255,255,0.02)" : "transparent" }}
                      >
                        {colItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="card"
                                style={{
                                  ...provided.draggableProps.style,
                                  padding: "1rem",
                                  background: snapshot.isDragging ? "#161616" : "#111",
                                  boxShadow: snapshot.isDragging ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
                                  display: "flex",
                                  gap: "0.5rem",
                                  alignItems: "flex-start"
                                }}
                              >
                                <div {...provided.dragHandleProps} style={{ color: "#444", marginTop: 2, cursor: "grab" }}>
                                  <GripVertical size={16} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#fff", marginBottom: item.description ? "0.25rem" : 0 }}>{item.title}</p>
                                  {item.description && <p style={{ fontSize: "0.8rem", color: "#888" }}>{item.description}</p>}
                                </div>
                                <button onClick={() => handleDelete(item.id)} style={{ color: "#444", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {addingTo === col.id && (
                          <form onSubmit={(e) => handleAddTask(e, col.id)} style={{ marginTop: "0.5rem" }}>
                            <input
                              autoFocus
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              onBlur={() => {
                                if (!newTaskTitle.trim()) setAddingTo(null);
                              }}
                              placeholder="Task title..."
                              className="input"
                              style={{ padding: "0.5rem", fontSize: "0.85rem" }}
                            />
                          </form>
                        )}
                        
                        {colItems.length === 0 && !addingTo && (
                          <div style={{ border: "1px dashed #222", borderRadius: 8, padding: "2rem 1rem", textAlign: "center", color: "#555", fontSize: "0.85rem" }}>
                            Drop tasks here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}
