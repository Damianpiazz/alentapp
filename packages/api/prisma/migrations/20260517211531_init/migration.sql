-- AddForeignKey
ALTER TABLE "Locker" ADD CONSTRAINT "Locker_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
