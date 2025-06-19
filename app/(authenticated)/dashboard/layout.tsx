import { getCustomerByUserId, createCustomer } from "@/actions/customers"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import DashboardClientLayout from "./_components/layout-client"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect("/login")
  }

  let customer = await getCustomerByUserId(user.id)

  // If no customer record exists, create one with a default "free" membership
  if (!customer) {
    const { isSuccess, data } = await createCustomer(user.id)
    if (isSuccess) {
      customer = data ?? null
    }
  }

  // Gate dashboard access for pro members only in production. In development, allow free accounts to ease testing.
  // Store a message to show why they were redirected
  const isProduction = process.env.NODE_ENV === "production"
  const isAllowed = customer && (customer.membership === "pro" || (!isProduction && customer.membership === "free"))

  if (!isAllowed) {
    // Using searchParams to pass a message that can be read by client components
    redirect("/?redirect=dashboard#pricing")
  }

  const userData = {
    name:
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.username || "User",
    email: user.emailAddresses[0]?.emailAddress || "",
    avatar: user.imageUrl,
    membership: customer.membership
  }

  return (
    <DashboardClientLayout userData={userData}>
      {children}
    </DashboardClientLayout>
  )
}
