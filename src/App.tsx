/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';
import { useEffect, useState } from 'react';
import { Todo } from './types/Todo';
import { ErrorMessage } from './types/ErrorMessage';
import { ErrorNotification } from './components/ErrorNotification';
import {
  getTodos,
  addTodoToServer,
  deleteTodoFromServer,
  USER_ID,
} from './api/todos';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { UserWarning } from './UserWarning';
import { TodoItem } from './components/TodoItem';

type StatusFilter = 'all' | 'active' | 'completed';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [visibleTodos, setVisibleTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | ''>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);

  useEffect(() => {
    if (!USER_ID) {
      return;
    }

    const loadTodos = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const todosFromServer = await getTodos();

        setTodos(todosFromServer);
      } catch {
        setErrorMessage(ErrorMessage.LoadTodos);
      } finally {
        setIsLoading(false);

        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      }
    };

    loadTodos();
  }, []);

  useEffect(() => {
    let filtered = [...todos];

    if (statusFilter === 'active') {
      filtered = filtered.filter(todo => !todo.completed);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(todo => todo.completed);
    }

    setVisibleTodos(filtered);
  }, [todos, statusFilter]);

  const handleFilterChange = (filter: 'all' | 'active' | 'completed') => {
    setStatusFilter(filter);
  };

  const handleAddTodo = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTittle = newTodoTitle.trim();

    if (!trimmedTittle) {
      setErrorMessage(ErrorMessage.EmptyTitle);

      return;
    }

    const temp = {
      id: 0,
      userId: USER_ID,
      title: trimmedTittle,
      completed: false,
    };

    setTempTodo(temp);
    setErrorMessage('');

    try {
      const createdTodo = await addTodoToServer(trimmedTittle, USER_ID);

      setTodos(prev => [...prev, createdTodo]);
      setNewTodoTitle('');
    } catch {
      setErrorMessage(ErrorMessage.AddTodo);
      setNewTodoTitle(trimmedTittle);
    } finally {
      setTempTodo(null);
    }
  };

  const handleDelete = async (todoId: number) => {
    setLoadingTodoIds(prev => [...prev, todoId]);

    try {
      await deleteTodoFromServer(todoId);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch {
      setErrorMessage(ErrorMessage.DeleteTodo);
    } finally {
      setLoadingTodoIds(prev => prev.filter(id => id !== todoId));
    }
  };

  const handleClearCompleted = async () => {
    const completed = todos.filter(todo => todo.completed);

    await Promise.all(
      completed.map(async todo => {
        setLoadingTodoIds(prev => [...prev, todo.id]);

        try {
          await deleteTodoFromServer(todo.id);
          setTodos(prev => prev.filter(t => t.id !== todo.id));
        } catch {
          setErrorMessage(ErrorMessage.DeleteTodo);
        } finally {
          setLoadingTodoIds(prev => prev.filter(id => id !== todo.id));
        }
      }),
    );
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          newTodoTitle={newTodoTitle}
          setNewTodoTitle={setNewTodoTitle}
          onAdd={handleAddTodo}
          isAdding={!!tempTodo}
          todoCount={todos.length}
        />

        {isLoading ? (
          <div className="loader" data-cy="Loader" />
        ) : (
          <>
            <TodoList
              todos={visibleTodos}
              onDelete={handleDelete}
              loadingTodoIds={loadingTodoIds}
            />

            {tempTodo && <TodoItem todo={tempTodo} isProcessed={true} />}
          </>
        )}

        {todos.length > 0 && (
          <Footer
            statusFilter={statusFilter}
            onFilterChange={handleFilterChange}
            activeCount={todos.filter(todo => !todo.completed).length}
            completedCount={completedCount}
            onClearCompleted={handleClearCompleted}
          />
        )}

        <ErrorNotification
          message={errorMessage}
          onClose={() => setErrorMessage('')}
        />
      </div>
    </div>
  );
};
