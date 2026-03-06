export const PublicRoutes = {
  enterCode: "/"
};

export const privateRoutes = {
  quiz: "/quiz",
  quizProgress: "/quiz/progress"
};

export const routes = {
  ...PublicRoutes,
  ...privateRoutes,
};
