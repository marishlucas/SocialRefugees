
import { useContext, useEffect, useState } from "preact/hooks";
import Navbar from "../components/Navbar";
import { userContext } from "../userContext";
import Input from "../components/Input";

import {
  BellIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/20/solid'
import Notification from "../components/Notification";

let navigation = [
  { name: 'Cont', href: '/account', icon: UserCircleIcon, current: false },
  { name: 'Notificari', href: '/notifications', icon: BellIcon, current: false },
  { name: 'Grupuri', href: '/creategroup', icon: UsersIcon, current: true },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Account() {
  const { user, setUser } = useContext(userContext)

  if (user.role == "helper") return "Access Denied"
  const [searchUsers, setUsers] = useState()
  const [success, setSuccess] = useState({ status: false, message: "" })

  const needs = [
    { id: 1, name: 'mancare' },
    { id: 2, name: 'cazare' },
    { id: 3, name: 'haine' },
    { id: 4, name: 'apa' },
  ]


  const [userGroup, setUserGroup] = useState()
  const [isAdmin, setIsAdmin] = useState(false);
  const [userGroupMembers, setUserGroupMembers] = useState([])

  const [groupExists, setGroupExists] = useState(false);

  const getUsersFromGroup = async () => {
    const ids = userGroup.members.map((member) => member.user)
    try {
      const response = await fetch(`http://localhost:3001/users`, {
        method: "POST",
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(ids),
      });
      const res = await response.json()
      console.log(res)
      setUserGroupMembers(res)
    } catch (e) {
      console.log(e)
    }
  };

  useEffect(() => {
    console.log(userGroup)
    if (userGroup) {
      getUsersFromGroup()
    }
  }, [userGroup])

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(`http://localhost:3001/groups/${user._id}/user`, {
          method: 'POST',
          headers: {
            "Content-Type": "Application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
        });

        if (!response.ok) throw console.log(await response.json())

        const data = await response.json();
        console.log(data)
        if (data) {
          const isUserAccepted = userGroup?.members.some(member => member.user === user._id && member.status !== "pending");
          setGroupExists(true)
          setUserGroup(data.group)
          setIsAdmin(data.isAdmin)
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchGroup()
  }, [])

  const handleSearch = async event => {
    if (event.target.value.length < 3) return;
    try {
      const response = await fetch(`http://localhost:3001/users/search`, {
        method: 'POST',
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: event.target.value })
      });

      if (!response.ok) {
        console.log(await response.json());
      }

      const data = await response.json();
      setUsers(data)
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckboxChange = (e, need) => {
    const isChecked = e.target.checked;
    setUserGroup((prevData) => {
      if (isChecked) {
        return {
          ...prevData,
          needs: [...prevData.needs, need.name],
        };
      } else {
        const updatedNeeds = prevData.needs.filter((item) => item !== need.name);
        console.log(updatedNeeds)
        return {
          ...prevData,
          needs: updatedNeeds,
        };
      }
    });
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3001/groups/delete/`, {
        method: 'POST',
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ groupId: userGroup._id, userId: user._id })
      });

      const data = await response.json()
      if (!response.ok) {
        setSuccess({ status: true, error: true, message: data.message })
        throw new Error(response);
      }
      setSuccess({ status: true, error: false, message: data.message })
    } catch (error) {
      console.log(error)
    }
  }

  const handleExit = async () => {
    console.log(userGroup)
    try {
      const response = await fetch(`http://localhost:3001/groups/${user._id}/delete`, {
        method: 'POST',
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ groupId: userGroup._id })
      });

      const data = await response.json()
      if (!response.ok) {
        setSuccess({ status: true, error: true, message: data.message })
        throw new Error(response);
      }
      setSuccess({ status: true, error: false, message: data.message })
    } catch (error) {
      console.log(error)
    }

  }

  const handleCreate = async (e) => {
    e.preventDefault()
    //if group empty, create group
    //if it works, dont change it
    setIsAdmin(true)
    if (!userGroup) setUserGroup({
      ownerId: user._id,
      urgency: "urgent",
      needs: [],
      members: [{
        user: user._id,
        role: "admin"
      }]
    })

    else {
      if (!groupExists) {
        try {
          const response = await fetch(`http://localhost:3001/groups/`, {
            method: 'POST',
            headers: {
              "Content-Type": "Application/json",
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userGroup)
          });

          const data = await response.json()
          if (!response.ok) {
            setSuccess({ status: true, error: true, message: data.message })
            throw new Error(response);
          }
          setSuccess({ status: true, error: false, message: data.message })
        } catch (error) {
          console.log(error)
        }
      }
      else {
        try {
          const response = await fetch(`http://localhost:3001/groups/${userGroup._id}/update`, {
            method: 'PATCH',
            headers: {
              "Content-Type": "Application/json",
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ ...userGroup, ownerName: user.name })
          });

          const data = await response.json()
          console.log(data)
          if (!response.ok) {
            setSuccess({ status: true, error: true, message: data.message })
            throw new Error(response);
          }
          setSuccess({ status: true, message: data.message })
        } catch (error) {
          console.log(error)
        }

      }
    }
  }

  return (
    <div>
      <svg
        className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
            width={200}
            height={200}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M100 200V.5M.5 .5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
          <path
            d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect width="100%" height="100%" strokeWidth={0} fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)" />
      </svg>
      <Navbar />
      <div class="mx-auto max-w-7xl pt-16 lg:flex lg:gap-x-16 lg:px-8">
        <aside class="flex overflow-x-auto border-b border-gray-900/5 py-4 lg:block lg:w-64 lg:flex-none lg:border-0 lg:py-20">
          <nav class="flex-none px-4 sm:px-6 lg:px-0">
            <ul role="list" className="flex gap-x-3 gap-y-1 whitespace-nowrap lg:flex-col">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={classNames(
                      item.current
                        ? `bg-gray-50 ${user.role == "helper" ? "text-red-600" : "text-yellow-600"}`
                        : `text-gray-700 ${user.role == "helper" ? "hover:text-red-600" : "hover:text-yellow-600"} hover:bg-gray-50`,
                      'group flex gap-x-3 rounded-md py-2 pl-2 pr-3 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        item.current ? `${user.role == "helper" ? "text-red-600" : "text-yellow-600"} text-red-600` : `text-gray-400 ${user.role == "helper" ? "group-hover:text-red-600" : "group-hover:text-yellow-600"}`,
                        'h-6 w-6 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="bg-gray-50 rounded-3xl mt-8 sm:mb-8 flex-1 xl:overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Grupul tău</h1>
            <form onSubmit={(e) => handleCreate(e)} className="divide-y-slate-200 mt-6 space-y-8">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
                <div className="sm:col-span-6">
                  <h2 className="text-xl font-bold text-slate-900">{groupExists ? isAdmin && "Updatează Grupul" : "Creează un grup"}</h2>
                  {
                    !groupExists &&
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Dacă nu ai un grup, poți face unul
                    </p>
                  }
                </div>
                {
                  userGroup && isAdmin &&
                  <div className="sm:col-span-6">
                    <div className="sm:col-span-6">
                      <Input
                        required={false}
                        type="text"
                        name="Caută utilizatori"
                        id="name"
                        onChange={handleSearch}
                      />
                    </div>
                  </div>
                }
              </div>
              {
                userGroup &&
                <div>
                  <div>
                    <ul role="list" className="divide-y divide-gray-100">
                      {searchUsers && searchUsers.map((person) => (
                        person._id != user._id &&
                        <li key={person.email} className="flex justify-between items-center gap-x-6 py-2">
                          <div className="flex gap-x-4">
                            <img className="h-12 w-12 flex-none rounded-full bg-gray-50" src={`http://localhost:3001/${person.picturePath ? person.picturePath : "assets/default.png"}`} alt="" />
                            <div className="min-w-0 flex-auto">
                              <p className="text-sm font-semibold leading-6 text-gray-900">{person.name}</p>
                              <p className="mt-1 truncate text-xs leading-5 text-gray-500">{person.location}</p>
                            </div>
                          </div>
                          <div className="flex sm:flex-col sm:items-end">
                            <button
                              type="button"
                              onClick={() => {
                                const isMember = userGroup.members.some((member) => member.user === person._id);
                                if (isMember) return;
                                setUserGroup((prevState) => ({
                                  ...prevState,
                                  members: [
                                    ...prevState.members,
                                    {
                                      user: person._id,
                                      role: "user",
                                      status: "pending"
                                    }
                                  ]
                                }));
                              }}
                              className="rounded-full bg-yellow-600 p-1 text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yello-600"
                            >
                              <PlusIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="">
                    <div className="mt-8 flow-root">
                      <div className="overflow-x-auto">
                        <div className="bg-white rounded-xl ring-1 ring-inset ring-gray-300 inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                  Nume
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Proveniență
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Rol
                                </th>
                                {
                                  groupExists &&
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Status
                                  </th>}
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                  <span className="sr-only">Remove</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {userGroupMembers && userGroupMembers.map((person) => (
                                <tr key={person?.email}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                    {person?.name}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{person?.location}</td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{userGroup?.members.map((member) => member.user == person._id ? member.role : "")}</td>
                                  {groupExists && <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{userGroup?.members.map((member) => (member.user == person._id) ? member.status ? <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                    {member.status}
                                  </span> : null : null)}</td>}
                                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                    <button onClick={() => {
                                      setUserGroup((prevState) => ({
                                        ...prevState,
                                        members:
                                          prevState.members.filter((member) => member.user !== person._id)
                                      }))
                                    }}
                                      className="text-yellow-600 hover:text-yellow-900">
                                      {userGroup?.members.map((member) => isAdmin & member.user == person._id ? member.role === "admin" ? "" : "Remove" : "")}<span className="sr-only">, {person.name}</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    {
                      isAdmin &&
                      <div className="mt-8">
                        <fieldset className="bg-white py-2 px-4 sm:px-6 lg:px-8 rounded-xl ring-1 ring-inset ring-gray-300">
                          <p className="text-base font-semibold leading-6 text-gray-900 my-4">Nevoi</p>
                          <div className="divide-y divide-gray-200 border-t border-gray-200">
                            {needs.map((need, needId) => (
                              <div key={needId} className="relative flex items-start py-4">
                                <div className="min-w-0 flex-1 text-sm leading-6">
                                  <label htmlFor={`person-${need.id}`} className="select-none font-medium text-gray-900">
                                    {need.name}
                                  </label>
                                </div>
                                <div className="ml-3 flex h-6 items-center">
                                  <input
                                    id={`need-${need.id}`}
                                    name={`${need.name}`}
                                    checked={userGroup.needs.includes(need.name) ? true : false}
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:outline-none focus:ring-0 focus:ring-offset-0"
                                    onChange={(e) => handleCheckboxChange(e, need)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                    }
                  </div>
                </div>
              }
              <div>
                {
                  success.status &&
                  <div className="py-4">
                    <Notification setSuccess={setSuccess} success={success} />
                  </div>
                }
                {
                  <div className={`flex ${userGroup ? "justify-end pt-8" : "justify-start pt-0"} gap-x-3 `}>
                    {
                      isAdmin ?
                        groupExists &&
                        <button
                          type="button"
                          className="rounded-md bg-red-600 text-white px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-500"
                          onClick={handleDelete}
                        >
                          Delete
                        </button>
                        :
                        groupExists &&
                        <button
                          type="button"
                          className="rounded-md bg-red-600 text-white px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-500"
                          onClick={handleExit}
                        >
                          Iesi din grup
                        </button>
                    }
                    {
                      groupExists ?
                        isAdmin ?
                          <button
                            type="submit"
                            className="inline-flex justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            Updatează
                          </button>
                          : "" :
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          Creează
                        </button>
                    }
                  </div>
                }
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
