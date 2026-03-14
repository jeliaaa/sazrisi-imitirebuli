export const PublicRoutes = {
  enterCode: "/"
};

export const privateRoutes = {
  quiz: "/quiz",
  quizProgress: "/quiz/progress",
  test: "/test"
};

export const routes = {
  ...PublicRoutes,
  ...privateRoutes,
};
