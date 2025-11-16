import { NextResponse } from 'next/server';
import { destroyAdminSession } from '@/lib/auth/admin';

/**
 * POST /api/admin/logout
 * 
 * Cerrar sesión de admin
 * Iteración 7: Panel de Administración
 */
export async function POST() {
  try {
    await destroyAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin logout:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
