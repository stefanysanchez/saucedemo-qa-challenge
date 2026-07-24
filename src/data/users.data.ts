import { User } from '../types';

export const users: Record<string, User> = {
  standard: {
    username: 'standard_user',
    password: 'secret_sauce',
    description: 'Usuario sin restricciones, flujo feliz esperado',
  },
  lockedOut: {
    username: 'locked_out_user',
    password: 'secret_sauce',
    description: 'Usuario bloqueado, debe mostrar error al hacer login',
  },
  problem: {
    username: 'problem_user',
    password: 'secret_sauce',
    description: 'Usuario con bugs de UI conocidos (imágenes rotas, etc.)',
  },
  performanceGlitch: {
    username: 'performance_glitch_user',
    password: 'secret_sauce',
    description: 'Usuario con latencia artificial alta',
  },
};
