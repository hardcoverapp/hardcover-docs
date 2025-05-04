import {Components} from "@/components/index";

import {URLS} from "@/Consts";
import {getPreference, setPreference} from "@/lib/utils";
import {useEffect, useState} from "react";

import {IoSettingsOutline} from "react-icons/io5";
import {LuPencil} from "react-icons/lu";

export const EditLink = (link: any) => {
    const {text, url} = link;

    const [isDevMode, setIsDevMode] = useState(getPreference('editMode') === 'developer');
    const [editLink, setEditLink] = useState(isDevMode ? url.href.replace(URLS.GITHUB_EDIT, URLS.GITHUB_DEV) : url.href);

    useEffect(() => {
        setEditLink(isDevMode ? url.href.replace(URLS.GITHUB_EDIT, URLS.GITHUB_DEV) : url.href);
    }, [isDevMode]);


    return (
        <div className="flex items-center gap-2 ">
            <a
                href={editLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm no-underline font-medium text-gray-500 hover:text-gray-900
                dark:text-gray-400 dark:hover:text-white">
                <LuPencil/> {text}
            </a>

            <Components.ui.Popover>
                <Components.ui.PopoverTrigger className="bg-transparent mt-1 pointer">
                    <IoSettingsOutline/>
                </Components.ui.PopoverTrigger>
                <Components.ui.PopoverContent className="bg-gray-800 text-white">
                    <div className="flex flex-col gap-2">
                        <Components.ui.Label htmlFor="editMode">Edit Mode</Components.ui.Label>

                        <p className="text-xs ">
                            - Developer mode will open github.dev links instead of github.com links.
                            This is useful for quickly editing multiple files at once.

                            <br/>
                            <br/>

                            - Basic mode will open github.com links this is useful for quickly editing a single file.
                        </p>

                        <Components.ui.Select
                            defaultValue={getPreference('editMode')}
                            onValueChange={(value) => {
                                setPreference('editMode', value);
                                setIsDevMode(value === 'developer');
                            }}
                        >
                            <Components.ui.SelectTrigger className="w-[180px] pointer">
                                <Components.ui.SelectValue placeholder="Select edit mode"/>
                            </Components.ui.SelectTrigger>
                            <Components.ui.SelectContent className="bg-gray-700 text-white">
                                <Components.ui.SelectItem value="basic" className="pointer">Basic</Components.ui.SelectItem>
                                <Components.ui.SelectItem value="developer" className="pointer">Developer</Components.ui.SelectItem>
                            </Components.ui.SelectContent>
                        </Components.ui.Select>
                    </div>
                </Components.ui.PopoverContent>
            </Components.ui.Popover>
        </div>
    )
}