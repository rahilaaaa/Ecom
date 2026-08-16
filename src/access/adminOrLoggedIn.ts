import type { Access } from 'payload'

export const adminOrLoggedIn: Access = ({ req: { user } }) => Boolean(user)

