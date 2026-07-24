/**
 * @license
 * SPDX-License-Identifier:  Apache-2.0 
 */

import { createContext,useContext,useState }  from "react";
import type { ReactNode } from "react";

interface UIContextType{
    isFullscreenModalOpen:boolean;
    setFullscreenModalOpen:(open:boolean)=>void;
}

const UIContext = createContext<UIContextType | null>(null);

//Profile ውስጥ ViewVideo (ወይም ለላ ሙሉ ገት Modal)ክፍት ሲሆነ Layout's BottomNav  ን መደበከክ
export function UIProvider({children}: {children: ReactNode}){
    const [isFullscreenModalOpen, setFullscreenModalOpen]=useState(false);

    return(
        <UIContext.Provider value={{isFullscreenModalOpen, setFullscreenModalOpen}}>
            {children}
        </UIContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI(){
    const ctx=useContext(UIContext);
    if(!ctx) throw new Error("useUI must be used within UIProvider");
    return ctx;
}