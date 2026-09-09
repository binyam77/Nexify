/////function RequireAuth({ children }: { children: React.ReactNode }) {
  // ⚠️ TEMPORARY DEV BYPASS — Login ሳያደርጉ Home/Profile/Settings ማየት
  // እንዲችሉ። ወደ ነበረበት ለመመለስ: ይህን 1 መስመር (return <>{children}</>;) ብቻ
  // ያጥፉ — ከታች ያለው እውነተኛው check በራሱ ይሰራል።
  //////return <>{children}</>;

  // eslint-disable-next-line no-unreachable
  /////const { isLoggedIn } = useAuth();
  ///////const location = useLocation();

  //////if (!isLoggedIn) {
    /////return <Navigate to="/login" state={{ from: location }} replace />;
 ///// }

  /////return <>{children}</>;
/////}



// <Route path="/" element={<Navigate to={ROUTES.home} replace />} />





//function RequireAuth({ children }: { children: React.ReactNode }) {
  //const { isLoggedIn } = useAuth();
  //const location = useLocation();

  //if (!isLoggedIn) {
    //return <Navigate to="/login" state={{ from: location }} replace />;
  //}

  //return <>{children}</>;
//}


//<Route path="/" element={<FirstEntry />} />