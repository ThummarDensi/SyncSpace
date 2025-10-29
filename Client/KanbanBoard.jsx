import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getTasks, createTask, updateTask, moveTask } from '../redux/slices/taskSlice';
import { getBoardById } from '../redux/slices/boardSlice';
import { addTaskRealtime, updateTaskRealtime, moveTaskRealtime } from '../redux/slices/taskSlice';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import './KanbanBoard.css';

const KanbanBoard = () => {
  const { boardId, workspaceId } = useParams();
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.task);
  const { currentBoard } = useSelector((state) => state.board);
  const { user } = useSelector((state) => state.auth);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [createTaskLoading, setCreateTaskLoading] = useState(false);

  useEffect(() => {
    if (boardId) {
      dispatch(getBoardById(boardId));
      dispatch(getTasks(boardId));
    }
  }, [boardId, dispatch]);

  useEffect(() => {
    if (workspaceId) {
      socketService.joinWorkspace(workspaceId);

      // Socket listeners
      socketService.onTaskCreated((task) => {
        dispatch(addTaskRealtime(task));
      });

      socketService.onTaskUpdated((task) => {
        dispatch(updateTaskRealtime(task));
      });

      socketService.onTaskMoved((data) => {
        dispatch(moveTaskRealtime(data));
      });
    }

    return () => {
      if (workspaceId) {
        socketService.leaveWorkspace(workspaceId);
      }
    };
  }, [workspaceId, dispatch]);

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!newTaskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setCreateTaskLoading(true);
      const result = await dispatch(
        createTask({
          title: newTaskTitle,
          boardId,
          columnId: selectedColumn,
        })
      ).unwrap();

      socketService.emitTaskCreated({
        workspaceId,
        task: result,
      });

      toast.success('Task created');
      setShowTaskModal(false);
      setNewTaskTitle('');
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setCreateTaskLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    try {
      await dispatch(
        moveTask({
          id: draggableId,
          data: {
            sourceColumnId: source.droppableId,
            destinationColumnId: destination.droppableId,
            sourceIndex: source.index,
            destinationIndex: destination.index,
          },
        })
      ).unwrap();

      socketService.emitTaskMoved({
        workspaceId,
        taskId: draggableId,
        sourceColumnId: source.droppableId,
        destinationColumnId: destination.droppableId,
        sourceIndex: source.index,
        destinationIndex: destination.index,
      });
    } catch (error) {
      toast.error('Failed to move task');
    }
  };

  const getTasksByColumn = (columnId) => {
    return tasks
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'var(--danger-color)';
      case 'medium':
        return 'var(--warning-color)';
      case 'low':
        return 'var(--secondary-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  if (loading || !currentBoard) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <div>
          <h1>{currentBoard.name}</h1>
          <p className="text-secondary">{currentBoard.description}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
          + Add Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-columns">
          {currentBoard.columns?.map((column) => (
            <div key={column.id} className="kanban-column">
              <div className="column-header">
                <h3>{column.title}</h3>
                <span className="task-count">
                  {getTasksByColumn(column.id).length}
                </span>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`column-tasks ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {getTasksByColumn(column.id).map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <h4>{task.title}</h4>
                            {task.description && (
                              <p className="task-description">{task.description}</p>
                            )}
                            
                            <div className="task-meta">
                              <span
                                className="priority-badge"
                                style={{ backgroundColor: getPriorityColor(task.priority) }}
                              >
                                {task.priority}
                              </span>
                              
                              {task.assignees && task.assignees.length > 0 && (
                                <div className="task-assignees">
                                  {task.assignees.slice(0, 3).map((assignee) => (
                                    <div key={assignee._id} className="assignee-avatar" title={assignee.name}>
                                      {assignee.avatar ? (
                                        <img src={assignee.avatar} alt={assignee.name} />
                                      ) : (
                                        <span>{assignee.name.charAt(0).toUpperCase()}</span>
                                      )}
                                    </div>
                                  ))}
                                  {task.assignees.length > 3 && (
                                    <span className="more-assignees">+{task.assignees.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Task</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Column</label>
                  <select
                    className="form-select"
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                  >
                    {currentBoard.columns?.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createTaskLoading}>
                  {createTaskLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
