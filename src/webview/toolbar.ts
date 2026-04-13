import type { Page } from './types';

const deriveTitle = (content: string): string => {
  const lines = content.split('\n');
  for (const line of lines) {
    const heading = line.match(/^#\s+(.+)/);
    if (heading) {
      return heading[1].trim().substring(0, 50);
    }
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return trimmed.substring(0, 50);
    }
  }
  return 'Empty note';
};

export interface ToolbarHandle {
  updatePages: (pages: Page[], activeId: string) => void;
  updateActiveTitle: (content: string) => void;
}

export const createToolbar = (
  container: HTMLElement,
  callbacks: {
    onNewPage: () => void;
    onDeletePage: (id: string) => void;
    onSwitchPage: (id: string) => void;
  },
): ToolbarHandle => {
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Select note page');
  const newBtn = document.createElement('button');
  newBtn.textContent = '+ New';
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.classList.add('spacer');

  container.appendChild(select);
  container.appendChild(newBtn);
  container.appendChild(deleteBtn);

  let currentPages: Page[] = [];
  let currentActiveId = '';

  select.addEventListener('change', () => {
    callbacks.onSwitchPage(select.value);
  });

  newBtn.addEventListener('click', () => {
    callbacks.onNewPage();
  });

  deleteBtn.addEventListener('click', () => {
    if (currentActiveId) {
      callbacks.onDeletePage(currentActiveId);
    }
  });

  const updatePages = (pages: Page[], activeId: string): void => {
    currentPages = pages;
    currentActiveId = activeId;
    select.textContent = '';
    for (const page of pages) {
      const option = document.createElement('option');
      option.value = page.id;
      option.textContent = deriveTitle(page.content);
      option.selected = page.id === activeId;
      select.appendChild(option);
    }
  };

  const updateActiveTitle = (content: string): void => {
    const option = select.querySelector(`option[value="${currentActiveId}"]`) as HTMLOptionElement | null;
    if (option) {
      option.textContent = deriveTitle(content);
    }
  };

  return { updatePages, updateActiveTitle };
};
