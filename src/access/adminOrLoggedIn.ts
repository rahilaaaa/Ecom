export const adminOrLoggedIn: Access = ({ req: { user } }) => Boolean(user)

