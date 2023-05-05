import {ArrowLeftIcon} from '@heroicons/react/24/solid'
import {Button, Tooltip} from '@mantine/core'
import type {ActionArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import * as React from 'react'
import {z} from 'zod'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/db.server'
import {requireUserId} from '~/session.server'
import {useStudentData} from '~/utils/hooks'
import {formatTime, setFixedDate} from '~/utils/misc'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

const AddScheduleSchema = z.object({
	sectionId: z.string().min(1, 'Section is required'),
})

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof AddScheduleSchema>
}

export const action = async ({request}: ActionArgs) => {
	const studentId = await requireUserId(request)
	const {fields, fieldErrors} = await validateAction(request, AddScheduleSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	await db.studentSchedule.create({
		data: {
			sectionId: fields.sectionId,
			studentId,
		},
	})
	return json({success: true})
}

export default function ManageSection() {
	const {allSections, schedules} = useStudentData()
	const fetcher = useFetcher<ActionData>()

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			// TODO: refresh the data
		} else if (fetcher.data?.fieldErrors) {
			alert('Cannot enroll in this section.')
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	return (
		<>
			<TailwindContainer className="rounded-md">
				<div className="px-4 py-10 sm:px-6 lg:px-8">
					<div className="sm:flex sm:flex-auto sm:items-center sm:justify-between">
						<div>
							<Button
								leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
								variant="subtle"
								size="md"
								component={Link}
								to=".."
								mb={20}
								color="gray"
							>
								Back
							</Button>
							<h1 className="flex w-full items-center justify-center text-3xl font-semibold text-gray-900">
								All Classes
							</h1>
						</div>
					</div>
					<div className="mt-8 flex flex-col">
						<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<ul className="grid grid-cols-3 gap-6">
									{allSections.map(section => {
										const isAlreadyEnrolled = schedules.some(
											s => s.sectionId === section.id
										)

										const isInConflict = schedules.some(s => {
											if (s.sectionId === section.id) {
												return false
											}

											const isSameDay = s.section.day === section.day
											if (!isSameDay) {
												return false
											}

											const currentSectionStart = setFixedDate(
												new Date(section.startTime)
											)
											const currentSectionEnd = setFixedDate(
												new Date(section.endTime)
											)

											const otherSectionStart = setFixedDate(
												new Date(s.section.startTime)
											)
											const otherSectionEnd = setFixedDate(
												new Date(s.section.endTime)
											)

											return (
												(currentSectionStart >= otherSectionStart &&
													currentSectionStart <= otherSectionEnd) ||
												(currentSectionEnd >= otherSectionStart &&
													currentSectionEnd <= otherSectionEnd)
											)
										})

										return (
											<Tooltip.Floating
												label="Conflicts with another class"
												color="red"
												disabled={!isInConflict}
												position="left"
												key={section.id}
											>
												<li className="flex flex-col gap-4 rounded border bg-gray-700 p-4 text-white">
													<p>
														Course: {section.course.name} ({section.course.code}
														)
													</p>

													<p>
														Section: {section.name} ({section.code})
													</p>

													<p>
														<span className="font-medium">{section.day}</span>
														<span>
															{formatTime(section.startTime)} -{' '}
															{formatTime(section.endTime)}
														</span>
													</p>

													<p>Faculty: {section.faculty.name}</p>

													<p>
														Room:
														{section.room.no}
													</p>

													<div>
														<Button
															variant="subtle"
															compact
															loading={isSubmitting}
															color="blue"
															disabled={isAlreadyEnrolled || isInConflict}
															onClick={() => {
																fetcher.submit(
																	{
																		sectionId: section.id,
																	},
																	{
																		method: 'post',
																		replace: true,
																	}
																)
															}}
														>
															{isAlreadyEnrolled
																? 'Enrolled'
																: isInConflict
																? 'Conflict'
																: 'Enroll'}
														</Button>
													</div>
												</li>
											</Tooltip.Floating>
										)
									})}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>
		</>
	)
}
