import { request } from './client';
import type { Bootstrap } from './types';

export const fetchBootstrap = () => request<Bootstrap>('/bootstrap');
