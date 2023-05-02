import {ArrowLeftIcon, PlusIcon} from '@heroicons/react/24/solid'
import {Button, Modal, Select, TextInput, clsx} from '@mantine/core'
import {TimeInput} from '@mantine/dates'
import {useDisclosure} from '@mantine/hooks'
import {Day} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import * as React from 'react'
import {z} from 'zod'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/db.server'
import {useAdminData} from '~/utils/hooks'
import {formatTime} from '~/utils/misc'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

enum MODE {
	edit,
	add,
}

const ManageSectionSchema = z.object({
	sectionId: z.string().optional(),
	name: z.string().min(1, 'Name is required'),
	code: z.string().min(1, 'Code is required'),
	courseId: z.string().min(1, 'Course is required'),
	roomId: z.string().min(1, 'Room is required'),
	facultyId: z.string().min(1, 'Faculty is required'),
	day: z.string().min(1, 'Day is required'),
	startTime: z.string().min(1, 'Start time is required'),
	endTime: z.string().min(1, 'End time is required'),
})
interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageSectionSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(
		request,
		ManageSectionSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const startDate = new Date()
	startDate.setHours(parseInt(fields.startTime), 0, 0, 0) // Set minutes, seconds, and milliseconds to 0
	const endDate = new Date()
	endDate.setHours(parseInt(fields.endTime), 0, 0, 0) // Set minutes, seconds, and milliseconds to 0

	const {sectionId, ...rest} = fields

	if (sectionId) {
		await db.section.update({
			where: {
				id: sectionId,
			},
			data: {
				code: rest.code,
				name: rest.name,
				courseId: rest.courseId,
				roomId: rest.roomId,
				facultyId: rest.facultyId,
				day: rest.day as Day,
				startTime: startDate,
				endTime: endDate,
			},
		})

		return json({success: true})
	}

	await db.section.create({
		data: {
			code: rest.code,
			name: rest.name,
			courseId: rest.courseId,
			roomId: rest.roomId,
			facultyId: rest.facultyId,
			day: rest.day as Day,
			startTime: startDate,
			endTime: endDate,
		},
	})

	return json({success: true})
}

export default function ManageSections() {
	const fetcher = useFetcher<ActionData>()
	const {sections, courses, faculties, rooms} = useAdminData()

	type _Section = typeof sections[number]

	const [selectedSectionId, setSelectedSectionId] = React.useState<
		_Section['id'] | null
	>(null)
	const [selectedSection, setSelectedSection] = React.useState<_Section | null>(
		null
	)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedSectionId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	React.useEffect(() => {
		if (!selectedSectionId) {
			setSelectedSection(null)
			return
		}

		const course = sections.find(c => c.id === selectedSectionId)
		if (!course) return

		setSelectedSection(course)
		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sections, selectedSectionId])

	return (
		<>
			<TailwindContainer className="rounded-md bg-white">
				<div className="mt-8 px-4 py-10 sm:px-6 lg:px-8">
					<div className="sm:flex sm:flex-auto sm:items-center sm:justify-between">
						<div>
							<Button
								leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
								variant="white"
								size="md"
								component={Link}
								to=".."
								pl={0}
								mb={20}
								color="gray"
							>
								Back
							</Button>
							<h1 className="text-3xl font-semibold text-gray-900">
								Manage Sections
							</h1>
							<p className="mt-2 text-sm text-gray-700">
								Manage the sections that are available to students.
							</p>
						</div>
						<div>
							<Button
								loading={isSubmitting}
								loaderPosition="left"
								onClick={() => {
									setMode(MODE.add)
									handleModal.open()
								}}
							>
								<PlusIcon className="h-4 w-4" />
								<span className="ml-2">Add</span>
							</Button>
						</div>
					</div>
					<div className="mt-8 flex flex-col">
						<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<table className="min-w-full divide-y divide-gray-300">
									<thead>
										<tr>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Code
											</th>

											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Name
											</th>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Course
											</th>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Time
											</th>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Room
											</th>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Faculty
											</th>
											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{sections.map(section => (
											<tr key={section.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{section.code}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{section.name}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{section.course.name}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													<p>{section.day} </p>
													<p>
														{formatTime(section.startTime!)}
														{' - '}
														{formatTime(section.endTime!)}
													</p>
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{section.room.no}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{section.faculty.name}
												</td>

												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
													<div className="flex items-center gap-6">
														<Button
															loading={isSubmitting}
															variant="subtle"
															loaderPosition="right"
															onClick={() => {
																setSelectedSectionId(section.id)
																setMode(MODE.edit)
															}}
														>
															Edit
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					setSelectedSectionId(null)
					handleModal.close()
				}}
				title={clsx({
					'Edit venue': mode === MODE.edit,
					'Add venue': mode === MODE.add,
				})}
				centered
				overlayBlur={1.2}
				overlayOpacity={0.6}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="sectionId" value={selectedSection?.id} />

						<TextInput
							name="code"
							label="Section Code"
							defaultValue={selectedSection?.code}
							error={fetcher.data?.fieldErrors?.code}
							required
						/>

						<TextInput
							name="name"
							label="Section Name"
							defaultValue={selectedSection?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<Select
							name="courseId"
							label="Course"
							defaultValue={selectedSection?.course.id}
							error={fetcher.data?.fieldErrors?.courseId}
							data={courses.map(course => ({
								value: course.id,
								label: course.name,
							}))}
							required
						/>

						<Select
							name="facultyId"
							label="Faculty"
							defaultValue={selectedSection?.faculty.id}
							error={fetcher.data?.fieldErrors?.facultyId}
							data={faculties.map(faculty => ({
								value: faculty.id,
								label: faculty.name,
							}))}
							required
						/>

						<Select
							name="roomId"
							label="Room"
							defaultValue={selectedSection?.room.id}
							error={fetcher.data?.fieldErrors?.roomId}
							data={rooms.map(room => ({
								value: room.id,
								label: room.no,
							}))}
							required
						/>

						<Select
							name="day"
							label="Day"
							defaultValue={selectedSection?.day}
							error={fetcher.data?.fieldErrors?.day}
							data={Object.values(Day).map(day => ({
								value: day,
								label: day,
							}))}
							required
						/>

						<div className="grid grid-cols-2 gap-4">
							<TimeInput
								name="startTime"
								label="Start Time"
								defaultValue={
									selectedSection?.startTime
										? new Date(selectedSection?.startTime)
										: null
								}
								error={fetcher.data?.fieldErrors?.startTime}
								required
							/>

							<TimeInput
								name="endTime"
								label="End Time"
								defaultValue={
									selectedSection?.endTime
										? new Date(selectedSection?.endTime)
										: null
								}
								error={fetcher.data?.fieldErrors?.endTime}
								required
							/>
						</div>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setSelectedSection(null)
									handleModal.close()
								}}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								{mode === MODE.edit ? 'Save changes' : 'Create'}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
