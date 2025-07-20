import { client } from '../utils/fetchClient';
import { Todo } from '../types/Todo';

export const USER_ID = 3257;

export const getTodos = () => {
  return client.get<Todo[]>(`/todos?userId=${USER_ID}`);
};

export const addTodoToServer = (title: string, userId: number) => {
  return client.post<Todo>('/todos', {
    title: title.trim(),
    userId,
    completed: false,
  });
};

export const deleteTodoFromServer = (todoId: number) => {
  return client.delete(`/todos/${todoId}`);
};
