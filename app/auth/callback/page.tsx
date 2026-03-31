// "use client";

// import Amplify, * as AmplifyAll from "aws-amplify";

// // If TS complains about named export, use this runtime-safe import:
// const Auth = (AmplifyAll as any).Auth;
// import { useRouter } from "next/navigation";

// export default function CallbackPage() {
//   const router = useRouter();

//   async function completeLogin() {
//     const session = await Auth.currentSession();

//     const access = session.getAccessToken().getJwtToken();
//     const id = session.getIdToken().getJwtToken();

//     // send to server to set cookies
//     await fetch("/api/set-auth", {
//       method: "POST",
//       body: JSON.stringify({ access, id }),
//     });

//     router.push("/admin");
//   }

//   completeLogin();

//   return <p>Completing login...</p>;
// }
