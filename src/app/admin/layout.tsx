import React from "react";
import Topbar from "@/app/admin/components/Topbar";
import Sidebar from "./components/Sidebar";

const layout = () => {
  return (
    <>
      {/* <Topbar title="Dashboard Admin" /> */}
      <Topbar title="" />
      <Sidebar />
    </>
  );
};

export default layout;
