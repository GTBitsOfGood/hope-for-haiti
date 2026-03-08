import { auth } from "@/auth";
import { hasPermission, isStaff } from "@/lib/userUtils";
import StreamIoService from "@/services/streamIoService";
import { NotificationService } from "@/services/notificationService";
import { EmailClient } from "@/email";
import { db } from "@/db";
import { UserType } from "@prisma/client";
import {
	AuthenticationError,
	AuthorizationError, 
	ArgumentError,
	errorResponse,
	ok, 
} from "@/util/errors";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ channelId: string }> }
) {
	try {
		const session = await auth(); 

		if (!session?.user) {
			throw new AuthenticationError("Not authenticated"); 
		}
	
		if (!isStaff(session.user.type) || !hasPermission(session.user, "supportWrite")) {
			throw new AuthorizationError("You don't have permission to close tickets");
		}
	
		const { channelId } = await params; 
	
		if (!channelId) {
			throw new ArgumentError("Channel ID is required");
		}
	
		const channelData = await StreamIoService.getChannelData(channelId); 
	
		if (channelData.closed) {
			throw new ArgumentError("Ticket is already closed"); 
		}
	
		await StreamIoService.closeChannel(channelId); 
	
		const memberStreamUserIds = await StreamIoService.getChannelMembers(channelId);
	
		const partnerUsers = await db.user.findMany({
			where: {
				streamUserId: { in: memberStreamUserIds },
				type: UserType.PARTNER,
				enabled: true, 
			},
			select: {
				id: true, 
				email: true, 
				name: true, 
			},
		});
	
		const ticketUrl = `${process.env.BASE_URL}/support?channel-id=${channelId}`;
	
		await Promise.all(
			partnerUsers.map(async (partner) => {
				await NotificationService.publishNotificationWithoutSave(partner.id, {
					title: `Your support ticket "${channelData.name}" has been closed`,
					action: `/support?channel-id=${channelId}`,
					actionText: "View Ticket", 
				});
	
				await EmailClient.sendSupportTicketClosed(partner.email, {
					userName: partner.name,
					ticketName: channelData.name,
					ticketUrl,
				});
			}) 
		);
	
		return ok();
	} catch (error) {
		return errorResponse(error); 
	}
}