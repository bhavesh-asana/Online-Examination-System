import {ArrowLeftOnRectangleIcon} from '@heroicons/react/24/solid'

import {Anchor, Avatar, Divider, Header, Menu, ScrollArea} from '@mantine/core'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import type {ShouldReloadFunction} from '@remix-run/react'
import {Form, Link, Outlet} from '@remix-run/react'
import appConfig from 'app.config'
import {Footer} from '~/components/Footer'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/db.server'
import {isAdmin, isStudent, requireUserId} from '~/session.server'
import {useUser} from '~/utils/hooks'

export type FacultyLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const facultyId = await requireUserId(request)

	if (await isAdmin(request)) {
		return redirect('/admin')
	} else if (await isStudent(request)) {
		return redirect('/student')
	}

	const sections = await db.section.findMany({
		where: {facultyId},
		include: {
			course: true,
			faculty: true,
			room: true,
			schedules: true,
		},
	})

	return json({
		sections,
	})
}

export default function OrganizerAppLayout() {
	return (
		<div className="flex h-full flex-col">
			<HeaderComponent />
			<ScrollArea classNames={{root: 'flex-1 bg-gray-100'}}>
				<main>
					<Outlet />
				</main>
			</ScrollArea>
			<Footer />
		</div>
	)
}

function HeaderComponent() {
	const {user} = useUser()

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<Header height={100} p="md">
				<TailwindContainer>
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							<Anchor component={Link} to="/">
								<img
									className="h-12 object-cover object-center"
									src={appConfig.logo}
									alt="Logo"
								/>
							</Anchor>
						</div>

						<div className="flex items-center gap-4">
							<Menu
								position="bottom-start"
								withArrow
								transition="pop-top-right"
							>
								<Menu.Target>
									<button>
										<Avatar color="blue" size="md">
											{user.name.charAt(0)}
										</Avatar>
									</button>
								</Menu.Target>

								<Menu.Dropdown>
									<Menu.Item disabled>
										<div className="flex flex-col">
											<p>{user.name}</p>
											<p className="mt-0.5 text-sm">{user.email}</p>
										</div>
									</Menu.Item>
									<Divider />

									<Menu.Item
										icon={<ArrowLeftOnRectangleIcon className="h-4 w-4" />}
										type="submit"
										form="logout-form"
									>
										Logout
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</div>
					</div>
				</TailwindContainer>
			</Header>
		</>
	)
}

export const unstable_shouldReload: ShouldReloadFunction = ({
	submission,
	prevUrl,
	url,
}) => {
	if (!submission && prevUrl.pathname === url.pathname) {
		return false
	}

	return true
}
