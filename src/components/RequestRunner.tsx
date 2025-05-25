import { Tab, TabGroup, TabPanels, TabList, TabPanel } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, Suspense } from "react";
import RequestForm from "./forms/RequestForm";
import CollectionRunner from "./CollectionRunner";
import HistoryViewer from "./History";
import CollectionsManager from "./CollectionManager";
import EnvironmentManager from "./EnvironmentManager";

function RequestRunner() {
  const [selectedTab, setSelectedTab] = useState(0);
  const tabs = ["Request", "Environment", "Collection Manage", "Collection Run", "History"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <TabGroup onChange={setSelectedTab}>
        <TabList className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                 ${selected
                  ? "bg-white dark:bg-gray-800 shadow text-black dark:text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"}`
              }
            >
              {tab}
            </Tab>
          ))}
        </TabList>

        <TabPanels className="mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabPanel>
                <Suspense fallback={<div>Loading...</div>}>
                  <RequestForm />
                </Suspense>
              </TabPanel>
              <TabPanel>
                <EnvironmentManager />
              </TabPanel>
              <TabPanel>
                <CollectionsManager />
              </TabPanel>
              <TabPanel>
                <CollectionRunner />
              </TabPanel>
              <TabPanel>
                <HistoryViewer />
              </TabPanel>
            </motion.div>
          </AnimatePresence>
        </TabPanels>
      </TabGroup>
    </motion.div>
  );
}

export default RequestRunner