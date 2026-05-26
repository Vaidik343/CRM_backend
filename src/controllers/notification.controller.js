const {Notification, User} = require("../models");

const createNotification = async (req, res) => {
    try {
        const {user_id,type, title, notification_message, data, is_read} = req.body;


        // make them separate
        if(!user_id || !title)
        {
            return res.status(403).json({message:"Field required"});
        }

        const user = await User.findByPk(user_id);

        if(!user)
        {
            return res.status(404).json({message:"User not found!"});
        }

        const notification = await Notification.create({
            user_id, type, title, notification_message, data, is_read
        });

        res.status(201).json(notification);
    } catch (error) {
         res.status(500).json({ message: "Internal server error" });
    }

}

const getAllNotification = async (req, res) => {
    try {
        const notification = await Notification.findAll();

        if(!notification)
        {
            return res.status(404).json({message:"Notification Not found"});
        }
        res.status(200).json({message:"List of notification", notification});
    } catch (error) {
         return res.status(500).json({ message: "Internal server error" });
    }
}


exports.module.notificationController = {
    createNotification, getAllNotification
} 